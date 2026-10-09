import { describe, expect, it } from "vitest";
import { extractFlowMetadata } from "./flowMetadata";

describe("extractFlowMetadata", () => {
  it("extracts the first trigger and unique sorted connector names recursively", () => {
    const clientdata = JSON.stringify({ properties: { definition: {
      triggers: { Recurrence: { type: "Recurrence" }, Other: { type: "Manual" } },
      actions: {
        first: { inputs: { host: { apiId: "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps" } } },
        second: { nested: [{ host: { connectionName: "shared_zebra" } }] },
        third: { host: { connectionName: "shared_zebra" } },
      },
    } } });

    expect(extractFlowMetadata(clientdata)).toEqual({
      trigger: { name: "Recurrence", type: "Recurrence", label: "Zeitplan" },
      connections: ["Dataverse", "zebra"],
    });
  });

  it("returns empty connections for absent or invalid JSON and omits incomplete triggers", () => {
    expect(extractFlowMetadata()).toEqual({ connections: [] });
    expect(extractFlowMetadata("not json")).toEqual({ connections: [] });
    expect(extractFlowMetadata(JSON.stringify({ properties: { definition: { triggers: { trigger: {} } } } })))
      .toEqual({ trigger: undefined, connections: [] });
  });
});
