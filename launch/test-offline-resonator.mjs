#!/usr/bin/env node
/**
 * Local-only acceptance suite for the offline sovereign resonator prototype.
 *
 * This script models the device policy and durable store-and-forward queue
 * without opening sockets, enabling radios, contacting ARCHANGEL, or claiming
 * that a real RF driver has been tested. It is intentionally dependency-free.
 */

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const POLICIES = [
  "AIR_GAPPED",
  "LOCAL_ONLY",
  "SCHEDULED_SYNC",
  "UPLINK_ENABLED",
  "EMERGENCY_DISABLE",
];

const NORMAL_TRANSITIONS = new Map([
  ["AIR_GAPPED", new Set(["LOCAL_ONLY", "EMERGENCY_DISABLE"])],
  ["LOCAL_ONLY", new Set(["AIR_GAPPED", "SCHEDULED_SYNC", "EMERGENCY_DISABLE"])],
  ["SCHEDULED_SYNC", new Set(["LOCAL_ONLY", "UPLINK_ENABLED", "EMERGENCY_DISABLE"])],
  ["UPLINK_ENABLED", new Set(["SCHEDULED_SYNC", "LOCAL_ONLY", "EMERGENCY_DISABLE"])],
  ["EMERGENCY_DISABLE", new Set(["AIR_GAPPED"])],
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function atomicWrite(file, value) {
  const tmp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  const fd = fs.openSync(tmp, "wx", 0o600);
  try {
    fs.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
  const dirFd = fs.openSync(path.dirname(file), "r");
  try {
    fs.fsyncSync(dirFd);
  } finally {
    fs.closeSync(dirFd);
  }
}

class RadioPolicy {
  constructor(initial = "AIR_GAPPED") {
    assert(POLICIES.includes(initial));
    this.state = initial;
    this.events = [];
  }

  transition(next, reason = "test") {
    assert(POLICIES.includes(next), `unknown radio policy: ${next}`);
    const allowed = this.state === "EMERGENCY_DISABLE"
      ? next === "AIR_GAPPED"
      : NORMAL_TRANSITIONS.get(this.state)?.has(next);
    assert(allowed, `invalid transition ${this.state} -> ${next}`);
    const previous = this.state;
    this.state = next;
    this.events.push({ previous, next, reason });
    return { previous, next };
  }

  allowsInternet() {
    return this.state === "UPLINK_ENABLED";
  }

  allowsLocalPeer() {
    return this.state !== "AIR_GAPPED" && this.state !== "EMERGENCY_DISABLE";
  }

  allowsExternalSend() {
    return this.state === "SCHEDULED_SYNC" || this.state === "UPLINK_ENABLED";
  }
}

/**
 * Hardware boundary model. This deterministic fake GPIO board never opens
 * /sys, libgpiod, a serial port, or a radio. The physical switch remains the
 * fail-closed authority for RF power in these acceptance tests.
 */
class FakeGpioBoard {
  constructor({ switchClosed = true, radioPower = false } = {}) {
    this.switchClosed = switchClosed;
    this.radioPower = radioPower;
    this.commands = [];
  }

  readDisableSwitch() {
    return this.switchClosed;
  }

  setRadioPower(enabled) {
    this.radioPower = enabled;
    this.commands.push({ action: "set-radio-power", enabled });
  }
}

class PhysicalRadioDisableDriver {
  constructor(board) {
    this.board = board;
  }

  boot() {
    this.board.setRadioPower(false);
    return this.status();
  }

  status() {
    const disabledBySwitch = this.board.readDisableSwitch();
    return {
      disabledBySwitch,
      radioPower: this.board.radioPower,
      safe: disabledBySwitch ? !this.board.radioPower : true,
    };
  }

  requestRadioPower(enabled) {
    if (enabled && this.board.readDisableSwitch()) {
      this.board.setRadioPower(false);
      throw new Error("physical radio-disable switch is engaged");
    }
    this.board.setRadioPower(enabled);
    const state = this.status();
    assert(state.safe, "radio driver entered an unsafe state");
    return state;
  }

  emergencyDisable() {
    this.board.setRadioPower(false);
    return this.status();
  }
}

class DurableQueue {
  constructor(file) {
    this.file = file;
    this.state = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, "utf8"))
      : { pending: [], consumed: [], audit: [] };
  }

  persist() {
    atomicWrite(this.file, this.state);
  }

  enqueue(envelope) {
    assert(envelope.messageId, "messageId required");
    assert(envelope.payloadHash, "payloadHash required");
    assert(!this.state.consumed.includes(envelope.messageId), "message already consumed");
    assert(!this.state.pending.some((item) => item.messageId === envelope.messageId), "message already queued");
    this.state.pending.push(envelope);
    this.state.audit.push({ event: "queued", messageId: envelope.messageId });
    this.persist();
  }

  peek() {
    return this.state.pending[0] ?? null;
  }

  acknowledge(messageId, payloadHash) {
    const index = this.state.pending.findIndex((item) => item.messageId === messageId);
    assert(index >= 0, "message is not pending");
    const envelope = this.state.pending[index];
    assert.equal(envelope.payloadHash, payloadHash, "payload hash mismatch");
    this.state.pending.splice(index, 1);
    this.state.consumed.push(messageId);
    this.state.audit.push({ event: "acknowledged", messageId, payloadHash });
    this.persist();
  }

  rejectReplay(messageId) {
    assert(this.state.consumed.includes(messageId), "expected consumed message ID");
    this.state.audit.push({ event: "replay-rejected", messageId });
    this.persist();
  }
}

function makeEnvelope(messageId, body, createdAt = "2026-01-01T00:00:00.000Z") {
  const payloadHash = `sha256:${sha256(canonical(body))}`;
  return {
    schema: "PHARO_LAPSE_ENVELOPE/v1",
    messageId,
    senderId: "resonator-test-a",
    recipientId: "resonator-test-b",
    createdAt,
    expiresAt: "2026-01-02T00:00:00.000Z",
    payloadHash,
    protocolVersion: "1.1.0",
    body,
    signature: "test-fixture-signature-not-production-cryptography",
  };
}

function expectFailure(fn, label) {
  assert.throws(fn, undefined, label);
}

function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "resonator-suite-"));
  const queueFile = path.join(root, "queue.json");
  const results = [];
  const test = (name, fn) => {
    fn();
    results.push(name);
  };

  test("starts radio-quiet in AIR_GAPPED", () => {
    const policy = new RadioPolicy();
    assert.equal(policy.state, "AIR_GAPPED");
    assert.equal(policy.allowsInternet(), false);
    assert.equal(policy.allowsLocalPeer(), false);
    assert.equal(policy.allowsExternalSend(), false);
  });

  test("permits the reviewed policy progression", () => {
    const policy = new RadioPolicy();
    policy.transition("LOCAL_ONLY", "local peer test");
    assert.equal(policy.allowsLocalPeer(), true);
    assert.equal(policy.allowsInternet(), false);
    policy.transition("SCHEDULED_SYNC", "scheduled window test");
    assert.equal(policy.allowsExternalSend(), true);
    policy.transition("UPLINK_ENABLED", "explicit operator test");
    assert.equal(policy.allowsInternet(), true);
    policy.transition("EMERGENCY_DISABLE", "shutdown test");
    assert.equal(policy.allowsInternet(), false);
    assert.equal(policy.allowsLocalPeer(), false);
    policy.transition("AIR_GAPPED", "recovery test");
    assert.equal(policy.state, "AIR_GAPPED");
  });

  test("rejects bypass transitions and software-only recovery from emergency disable", () => {
    const policy = new RadioPolicy();
    expectFailure(() => policy.transition("UPLINK_ENABLED"), "air-gapped bypass");
    policy.transition("LOCAL_ONLY");
    policy.transition("EMERGENCY_DISABLE");
    expectFailure(() => policy.transition("UPLINK_ENABLED"), "emergency bypass");
    expectFailure(() => policy.transition("LOCAL_ONLY"), "emergency software recovery");
  });

  test("boots with radio power disabled even when the board starts dirty", () => {
    const board = new FakeGpioBoard({ switchClosed: true, radioPower: true });
    const driver = new PhysicalRadioDisableDriver(board);
    const state = driver.boot();
    assert.equal(state.disabledBySwitch, true);
    assert.equal(state.radioPower, false);
    assert.equal(state.safe, true);
  });

  test("physical disable switch blocks software radio enable", () => {
    const board = new FakeGpioBoard({ switchClosed: true });
    const driver = new PhysicalRadioDisableDriver(board);
    driver.boot();
    expectFailure(() => driver.requestRadioPower(true), "engaged physical switch");
    assert.equal(board.radioPower, false);
    assert.equal(driver.status().safe, true);
  });

  test("allows radio power only after the physical switch is released", () => {
    const board = new FakeGpioBoard({ switchClosed: false });
    const driver = new PhysicalRadioDisableDriver(board);
    driver.boot();
    const state = driver.requestRadioPower(true);
    assert.equal(state.disabledBySwitch, false);
    assert.equal(state.radioPower, true);
    assert.equal(state.safe, true);
  });

  test("emergency disable overrides an enabled radio", () => {
    const board = new FakeGpioBoard({ switchClosed: false });
    const driver = new PhysicalRadioDisableDriver(board);
    driver.boot();
    driver.requestRadioPower(true);
    const state = driver.emergencyDisable();
    assert.equal(state.radioPower, false);
    assert.equal(state.safe, true);
  });

  test("fails closed if the physical switch is engaged after enable", () => {
    const board = new FakeGpioBoard({ switchClosed: false });
    const driver = new PhysicalRadioDisableDriver(board);
    driver.boot();
    driver.requestRadioPower(true);
    board.switchClosed = true;
    const state = driver.status();
    assert.equal(state.disabledBySwitch, true);
    assert.equal(state.safe, false);
    const recovered = driver.emergencyDisable();
    assert.equal(recovered.radioPower, false);
    assert.equal(recovered.safe, true);
  });

  test("queues a signed-envelope-shaped message without network access", () => {
    const queue = new DurableQueue(queueFile);
    const envelope = makeEnvelope("msg-001", { kind: "field-observation", value: "local-only" });
    queue.enqueue(envelope);
    assert.equal(queue.peek().messageId, "msg-001");
    assert.equal(queue.peek().payloadHash, envelope.payloadHash);
  });

  test("persists pending messages across a simulated restart", () => {
    const restarted = new DurableQueue(queueFile);
    assert.equal(restarted.peek().messageId, "msg-001");
  });

  test("acknowledges only the matching payload and persists consumption", () => {
    const queue = new DurableQueue(queueFile);
    const envelope = queue.peek();
    queue.acknowledge(envelope.messageId, envelope.payloadHash);
    assert.equal(queue.peek(), null);
    const restarted = new DurableQueue(queueFile);
    assert.deepEqual(restarted.state.consumed, ["msg-001"]);
  });

  test("rejects replay after acknowledgement", () => {
    const queue = new DurableQueue(queueFile);
    expectFailure(() => queue.enqueue(makeEnvelope("msg-001", { kind: "replay" })), "replayed enqueue");
    queue.rejectReplay("msg-001");
    const restarted = new DurableQueue(queueFile);
    assert.equal(restarted.state.audit.at(-1).event, "replay-rejected");
  });

  test("rejects a tampered payload hash", () => {
    const queue = new DurableQueue(queueFile);
    const envelope = makeEnvelope("msg-002", { kind: "tamper-test", value: 1 });
    queue.enqueue(envelope);
    expectFailure(() => queue.acknowledge(envelope.messageId, "sha256:tampered"), "tampered hash");
    assert.equal(queue.peek().messageId, "msg-002");
  });

  test("preserves FIFO order for independent envelopes", () => {
    const queue = new DurableQueue(queueFile);
    queue.acknowledge("msg-002", queue.peek().payloadHash);
    queue.enqueue(makeEnvelope("msg-003", { order: 3 }));
    queue.enqueue(makeEnvelope("msg-004", { order: 4 }));
    assert.equal(queue.peek().messageId, "msg-003");
    queue.acknowledge("msg-003", queue.peek().payloadHash);
    assert.equal(queue.peek().messageId, "msg-004");
  });

  console.log(JSON.stringify({
    suite: "offline-sovereign-resonator-local",
    networkAccess: "none",
    productionChanges: false,
    passed: results.length,
    tests: results,
    queueFile: "temporary-test-fixture",
  }, null, 2));

  fs.rmSync(root, { recursive: true, force: true });
}

run();
