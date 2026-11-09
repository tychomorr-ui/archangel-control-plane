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
