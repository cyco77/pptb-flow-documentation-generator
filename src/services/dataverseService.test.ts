import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadFlowDefinitions,
  loadFlowDefinitionsForSolutions,
  loadSolutionPublisherCatalog,
} from "./dataverseService";

const api = vi.hoisted(() => ({ getSolutions: vi.fn(), queryData: vi.fn() }));
const record = (workflowid: string) => ({
  workflowid,
  name: `Flow ${workflowid}`,
  createdon: "2024-01-01T00:00:00Z",
  modifiedon: "2024-01-02T00:00:00Z",
  statecode: 1,
});

describe("dataverseService", () => {
  beforeEach(() => {
    api.getSolutions.mockReset();
    api.queryData.mockReset();
    Object.assign(window, { dataverseAPI: api });
  });

  it("loads and sorts a publisher catalog and pages through absolute next links", async () => {
    api.getSolutions.mockResolvedValue({ value: [
      { solutionid: "b", friendlyname: "Beta", _publisherid_value: "p" },
      { solutionid: "a", friendlyname: "Alpha", _publisherid_value: "p" },
    ] });
    api.queryData
      .mockResolvedValueOnce({ value: [{ publisherid: "p", friendlyname: "Maker" }], "@odata.nextLink": "https://org.test/api/data/v9.2/publishers?$skip=2" })
      .mockResolvedValueOnce({ value: [] });

    await expect(loadSolutionPublisherCatalog()).resolves.toEqual({
      solutions: [
        { id: "a", name: "Alpha", publisherId: "p", publisherName: "Maker" },
        { id: "b", name: "Beta", publisherId: "p", publisherName: "Maker" },
      ],
      publishers: ["Maker"],
    });
    expect(api.queryData.mock.calls.map(([url]) => url)).toEqual([
      "/publishers?$select=publisherid,friendlyname", "publishers?$skip=2",
    ]);
  });

  it("handles missing publisher names and uses solution IDs when names are absent", async () => {
    api.getSolutions.mockResolvedValue({ value: [
      { solutionid: "s1", friendlyname: "", _publisherid_value: "missing" },
      { solutionid: "s2", _publisherid_value: 4 },
      { solutionid: "", friendlyname: "Ignored" },
    ] });
    api.queryData.mockResolvedValue({ value: [] });

    await expect(loadSolutionPublisherCatalog()).resolves.toEqual({
      solutions: [
        { id: "s1", name: "s1", publisherId: "missing", publisherName: undefined },
        { id: "s2", name: "s2", publisherId: undefined, publisherName: undefined },
      ],
      publishers: [],
    });
  });

  it("loads plain flow definitions and returns no filtered flows for no selected solutions", async () => {
    api.queryData.mockResolvedValue({ value: [record("1")] });
    await expect(loadFlowDefinitions()).resolves.toMatchObject([{ workflowid: "1", name: "Flow 1" }]);
    await expect(loadFlowDefinitionsForSolutions([], [])).resolves.toEqual([]);
    expect(api.queryData).toHaveBeenCalledTimes(1);
  });

  it("deduplicates workflows and annotates solution and publisher names", async () => {
    api.queryData
      .mockResolvedValueOnce({ value: [
        { objectid: "flow-1", _solutionid_value: "s1" },
        { objectid: "flow-1", _solutionid_value: "s2" },
        { objectid: "flow-2", _solutionid_value: "unknown" },
      ] })
      .mockResolvedValueOnce({ value: [record("flow-1")] });

    const flows = await loadFlowDefinitionsForSolutions(["s1", "s2"], [
      { id: "s1", name: "Core", publisherName: "Maker" },
      { id: "s2", name: "Add-on", publisherName: "Maker" },
    ]);
    expect(flows).toMatchObject([{ workflowid: "flow-1", solution: "Core; Add-on", publisher: "Maker" }]);
    expect(api.queryData).toHaveBeenCalledTimes(2);
  });

  it("returns empty results when selected solutions have no workflows", async () => {
    api.queryData.mockResolvedValue({ value: [
      { objectid: 7, _solutionid_value: "s1" },
      { _solutionid_value: "s1" },
    ] });
    await expect(loadFlowDefinitionsForSolutions(["s1"], [{ id: "s1", name: "Core" }])).resolves.toEqual([]);
    expect(api.queryData).toHaveBeenCalledOnce();
  });

  it("handles unknown solutions and records without string IDs or publishers", async () => {
    api.queryData
      .mockResolvedValueOnce({ value: [
        { objectid: "workflow-1", _solutionid_value: "unknown" },
        { objectid: "workflow-1", _solutionid_value: "known" },
        { objectid: 7, _solutionid_value: "known" },
      ] })
      .mockResolvedValueOnce({ value: [record("workflow-1")] });
    const flows = await loadFlowDefinitionsForSolutions(["known"], [{ id: "known", name: "Core" }]);
    expect(flows).toMatchObject([{ solution: "Core", publisher: "" }]);
  });

  it("splits large solution lists into bounded batches", async () => {
    api.queryData.mockResolvedValue({ value: [] });
    await loadFlowDefinitionsForSolutions(Array.from({ length: 51 }, (_, index) => `id-${index}`), []);
    expect(api.queryData).toHaveBeenCalledTimes(2);
    expect(api.queryData.mock.calls[0][0]).toContain("id-49");
    expect(api.queryData.mock.calls[0][0]).not.toContain("id-50");
    expect(api.queryData.mock.calls[1][0]).toContain("id-50");
  });
});
