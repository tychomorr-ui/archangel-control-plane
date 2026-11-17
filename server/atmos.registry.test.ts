import { describe, expect, it } from "vitest";
import { ATMOS_CANONICAL_NODES, ATMOS_PROTOCOL, ATMOS_VERIFICATION_BOUNDARY } from "../shared/atmos";

describe("ATMOS canonical registry", () => {
  it("contains exactly the supplied verified 11-node cutover", () => {
    expect(ATMOS_PROTOCOL).toBe("ATMOS-1.1.1");
    expect(ATMOS_CANONICAL_NODES).toHaveLength(11);
    expect(ATMOS_CANONICAL_NODES.every(node => node.status === "VERIFIED")).toBe(true);
    expect(ATMOS_CANONICAL_NODES.map(node => node.nodeId)).toEqual([
      "ROOT-GATE",
      "TESSERACT-TERMINUS",
      "XINUS-CLARITY",
      "MONARCH-OS",
      "TESSERACT-A",
      "KEIRA",
      "VALKYRIE-ADJUDICATION-ENTITY",
      "ARCHANGEL",
      "PROJECT-RECLAIM",
      "IWA-SAGE",
      "RESONATE-EARTH",
    ]);
  });

  it("keeps canonical identity proof separate from measured application runtime", () => {
    expect(ATMOS_VERIFICATION_BOUNDARY).toContain("fingerprint");
    expect(ATMOS_VERIFICATION_BOUNDARY).toContain("manifest payload");
    expect(ATMOS_VERIFICATION_BOUNDARY).toContain("artifact hash");
    expect(ATMOS_CANONICAL_NODES.find(node => node.nodeId === "ARCHANGEL")).toMatchObject({
      canonicalEndpoint: "https://archangel.nexinus.net",
      applicationRuntimeMeasured: true,
    });
    expect(ATMOS_CANONICAL_NODES.find(node => node.nodeId === "ROOT-GATE")).toMatchObject({
      canonicalEndpoint: "https://rootgate.nexinus.net",
      applicationRuntimeMeasured: false,
    });
  });
});
