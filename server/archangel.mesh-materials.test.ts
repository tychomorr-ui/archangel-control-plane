import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const launchDirectory = join(projectDirectory, "launch");
const hubBootstrap = readFileSync(join(launchDirectory, "archangel-mesh-hub-bootstrap.sh"), "utf8");
const nodeBootstrap = readFileSync(join(launchDirectory, "archangel-mesh-node-bootstrap.sh"), "utf8");
const receiptVerifier = readFileSync(join(launchDirectory, "verify-archangel-signed-receipt.py"), "utf8");
const rootAuthorityBootstrap = readFileSync(join(launchDirectory, "archangel-root-authority-bootstrap.sh"), "utf8");
const nodeAdmission = readFileSync(join(launchDirectory, "create-archangel-node-admission.py"), "utf8");
const hubAdmissionInstaller = readFileSync(join(launchDirectory, "install-archangel-node-admission.py"), "utf8");
const hubActivation = readFileSync(join(launchDirectory, "activate-archangel-mesh-hub.sh"), "utf8");
const nodeActivation = readFileSync(join(launchDirectory, "activate-archangel-node-peer.sh"), "utf8");

describe("ARCHANGEL terminal mesh materials", () => {
  it("prepares the London hub without activating the overlay or changing observe-only authority", () => {
    expect(hubBootstrap).toContain('readonly HUB_ADDRESS="10.42.0.1/32"');
    expect(hubBootstrap).toContain('require_observe_only_baseline');
    expect(hubBootstrap).toContain('capabilities.get("node_enrollment") != "disabled"');
    expect(hubBootstrap).not.toContain("wg-quick up");
    expect(hubBootstrap).not.toContain("systemctl enable --now");
  });

  it("makes every node identity local, status-only, and explicitly disabled before enrollment", () => {
    expect(nodeBootstrap).toContain('status-ed25519.key.pem');
    expect(nodeBootstrap).toContain('wg-archangel.key');
    expect(nodeBootstrap).toContain('ThreadingHTTPServer((BIND_ADDRESS, PORT), Handler)');
    expect(nodeBootstrap).toContain('if self.path != "/v1/status"');
    expect(nodeBootstrap).toContain('"openssl", "pkeyutl", "-sign", "-rawin", "-inkey", PRIVATE_KEY, "-in", message.name');
    expect(nodeBootstrap).not.toContain("def do_POST");
    expect(nodeBootstrap).not.toContain("wg-quick up");
    expect(nodeBootstrap).not.toContain("systemctl enable --now archangel-status-agent");
  });

  it("verifies signatures and freshness before a receipt can be treated as valid", () => {
    expect(receiptVerifier).toContain('payload.get("version") != "ARCHANGEL/1"');
    expect(receiptVerifier).toContain('payload.get("node_id") != args.node_id');
    expect(receiptVerifier).toContain('expires_at <= now');
    expect(receiptVerifier).toContain('"openssl", "pkeyutl", "-verify", "-rawin"');
    expect(receiptVerifier).not.toContain("shell=True");
  });

  it("requires Root-Gate authorization and node proof before the London peer registry can render a peer", () => {
    expect(rootAuthorityBootstrap).toContain("admission-ed25519.key.pem");
    expect(rootAuthorityBootstrap).not.toContain("listen-port");
    expect(nodeAdmission).toContain('"type": "node.admission"');
    expect(nodeAdmission).toContain("valid-for-minutes must be between 1 and 60");
    expect(nodeAdmission).toContain('"openssl", "pkeyutl", "-sign", "-rawin", "-inkey", str(private_key), "-in", message.name');
    expect(hubAdmissionInstaller).toContain('"type") != "node.admission.ack"');
    expect(hubAdmissionInstaller).toContain("Node proof-of-possession verification failed.");
    expect(hubAdmissionInstaller).not.toContain("wg-quick up");
  });

  it("gates every transport activation behind an explicit terminal flag and preserves a hub-only spoke route", () => {
    expect(hubActivation).toContain('"${1:-}" == "--activate"');
    expect(hubActivation).toContain("require_observe_only_baseline");
    expect(nodeActivation).toContain("--root-public-key");
    expect(nodeActivation).toContain("Root-Gate admission signature verification failed.");
    expect(nodeActivation).toContain("AllowedIPs = 10.42.0.1/32");
    expect(nodeActivation).toContain("systemctl enable --now archangel-status-agent.service");
    expect(nodeActivation).not.toContain("AllowedIPs = 0.0.0.0/0");
  });
});
