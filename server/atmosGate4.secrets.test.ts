import { describe, expect, it } from "vitest";
import { gate4ConfigFromEnvironment, gate4Status } from "./atmosGate4";

describe("ATMOS Gate 4 configured secret posture", () => {
  it("recognizes the supplied server-side signing configuration without exposing key material", () => {
    const status = gate4Status(gate4ConfigFromEnvironment(), "durable");
    expect(status).toMatchObject({
      challengeEndpoint: "configured",
      operatorVerification: "configured",
      controlPlaneSigning: "configured",
      replayProtection: "durable",
      mutationPolicy: "NOOP_ONLY",
      externalMutation: "DISABLED",
    });
  });
});
