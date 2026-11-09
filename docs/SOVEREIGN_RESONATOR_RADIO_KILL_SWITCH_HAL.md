# Sovereign Resonator Physical Radio Kill-Switch HAL

**Status:** Hardware design contract; no physical GPIO access performed

## Purpose

The radio-disable switch is a hardware safety boundary, not a software preference. When the switch is engaged, the radio power rail must be physically interrupted so software cannot re-enable the radio. ARCHANGEL and Pharo-Lapse only observe and record the resulting state; they do not control the safety boundary.

## Required electrical architecture

```text
Battery / regulated rail
        │
        ├── always-on compute rail ── device CPU / secure element
        │
        └── normally-open or normally-closed safety-rated switch
                    │
                    └── radio power-enable rail ── RF module

GPIO input ── isolated sense circuit ── physical switch state
```

The exact polarity must be selected during hardware review, but the safe invariant is fixed: an open circuit, disconnected sense line, brownout, boot state, or unreadable GPIO must be interpreted as **radio disabled**. The GPIO sense line must not be the sole mechanism that removes radio power.

## HAL boundary

The driver must expose these operations:

```ts
interface PhysicalRadioKillSwitch {
  initializeFailClosed(): Promise<void>;
  readState(): Promise<"engaged" | "released" | "fault">;
  radioPowerPresent(): Promise<boolean>;
  requestRadioEnable(): Promise<never>; // must reject while switch is engaged or faulted
  emergencyDisable(): Promise<void>; // remove enable signal and verify absence of power
  selfTest(): Promise<{
    switchState: "engaged" | "released" | "fault";
    radioPowerPresent: boolean;
    safe: boolean;
  }>;
}
```

`initializeFailClosed()` must configure the hardware output to the disable value before any radio driver is initialized. `requestRadioEnable()` must never directly energize the radio rail; it may only request a supervised power controller to do so after the physical interlock reports `released`. `emergencyDisable()` must be idempotent and must verify that the radio power-good signal is absent.

## Fault behavior

The following conditions are fail-closed and must produce `fault` with radio power absent:

- GPIO controller unavailable or permission denied;
- switch input floating, contradictory, or outside the calibrated electrical range;
- power-good feedback unavailable or reports unexpected power;
- switch state changes during enable or self-test;
- watchdog timeout, process crash, or device reboot;
- secure-element or firmware identity failure;
- brownout or undervoltage on the radio rail.

No software retry may turn a fault into an enabled-radio state. Recovery requires a local operator procedure and a successful self-test.

## Required hardware tests

1. With the switch engaged, disconnect and reboot the device; confirm the RF module has no supply voltage.
2. With software requesting enable, engage the switch; confirm the hardware rail drops without waiting for the process.
3. Disconnect the GPIO sense wire; confirm `fault` and no radio power.
4. Simulate a stuck-high or stuck-low GPIO; confirm the independent power-good check rejects enable.
5. Kill the device process; confirm the external interlock remains radio-disabled.
6. Restore the switch only through the documented local procedure, then verify an operator-visible audit event.

These tests require the actual prototype, schematics, oscilloscope or power measurement, and a reviewed safety procedure. The current repository suite tests only a deterministic fake board and must not be presented as physical validation.

## Regulatory Alignment: Hardware-Level AI Kill Switches

The **Hardware Kill Switch** is a design control intended to support human oversight and rapid disablement of an AI-enabled device. When engaged, it physically removes power from the radio module and can be designed to remove power from a local accelerator or other AI compute rail as well. This is stronger than a software flag: a crashed, compromised, or misbehaving process cannot re-enable a rail that the independent interlock has opened.

This local-first design can provide evidence for a regulator or legal reviewer that the operator has a direct, local means to stop device computation and communications, subject to the actual schematic, component ratings, safety review, and witnessed test results. A cloud service may suspend a workload or revoke credentials, but it cannot by itself guarantee physical removal of power from hardware outside its custody. The device-level interlock narrows that gap by making the stop action local, observable, and fail-closed.

This is **Regulatory Alignment**, not a certification or legal conclusion. The EU AI Act, United States federal and state frameworks, radio rules, product-safety requirements, privacy laws, and sector-specific obligations vary by system risk, intended use, jurisdiction, and deployment context. The presence of a physical switch does not establish compliance, safety, conformity assessment, or permission to deploy. A qualified legal and safety review must map the implemented design to the requirements that actually apply.

The compliance evidence package should include: the approved schematic; component and isolation ratings; threat and misuse analysis; human-oversight procedure; access and custody controls; fault-injection results; power-rail measurements; firmware and hardware versions; maintenance records; and signed test evidence. The **Fail-Closed** invariant is that loss of software, GPIO sensing, power-good feedback, network connectivity, or operator session results in AI/radio power absent or in a separately reviewed safe state.

The two-device local overlay test remains the primary engineering milestone. Regulatory documentation does not substitute for demonstrating, on physical devices, that signed Pharo-Lapse envelopes queue and verify over an internet-disconnected local carrier.
