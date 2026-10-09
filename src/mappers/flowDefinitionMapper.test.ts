import { describe, expect, it } from "vitest";
import { mapFlowDefinitions } from "./flowDefinitionMapper";

const validRecord = {
  workflowid: "flow-1",
  name: "Example",
  description: null,
  createdon: "2024-01-01T00:00:00.000Z",
  modifiedon: new Date("2024-01-02T00:00:00.000Z"),
  statecode: 1,
  clientdata: JSON.stringify({ properties: { definition: { triggers: { manual: { type: "Manual" } }, actions: {} } } }),
};

describe("mapFlowDefinitions", () => {
  it("maps dates, trigger metadata, names, owners, and solution metadata", () => {
    const [flow] = mapFlowDefinitions([{
      ...validRecord,
      createdbyname: "Creator",
      modifiedbyname: "Editor",
      ownerid: { fullname: "Owner", internalemailaddress: "owner@example.com" },
      solutionname: "Core",
      publishername: "Publisher",
    }]);

    expect(flow).toMatchObject({
      workflowid: "flow-1", name: "Example", statecode: 1, createdby: "Creator", modifiedby: "Editor",
      trigger: { name: "manual", label: "Manueller Trigger" },
      owner: { name: "Owner", email: "owner@example.com" }, solution: "Core", publisher: "Publisher",
    });
    expect(flow.createdon).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    expect(flow.modifiedon).toEqual(validRecord.modifiedon);
    expect(flow.description).toBeUndefined();
  });

  it("uses formatted-value fallbacks and excludes invalid records", () => {
    const [flow] = mapFlowDefinitions([{
      ...validRecord,
      createdbyname: undefined,
      "_createdby_value@OData.Community.Display.V1.FormattedValue": "Formatted creator",
      ownerid: undefined,
      "_ownerid_value@OData.Community.Display.V1.FormattedValue": "Formatted owner",
    }, { ...validRecord, workflowid: 4 }, { ...validRecord, statecode: "1" }]);

    expect(flow.createdby).toBe("Formatted creator");
    expect(flow.owner).toEqual({ name: "Formatted owner", email: undefined });
    expect(mapFlowDefinitions([])).toEqual([]);
    expect(mapFlowDefinitions([{ ...validRecord, clientdata: 4 }])).toEqual([]);
  });
});
