import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  copyFlowDefinitionsAsCSV,
  copyFlowDefinitionsAsMarkdown,
  exportFlowDefinitionsToCSV,
  exportFlowDefinitionsToMarkdown,
  generateFlowDefinitionsCSVContent,
  generateFlowDefinitionsMarkdownContent,
} from "./exportUtils";
import type { FLowDefinition } from "../types/flowDefinition";

const flow: FLowDefinition = {
  workflowid: "id-1", name: "Flow | One", description: "Line one\nLine two", statecode: 1,
  createdon: new Date("2024-01-01T00:00:00Z"), modifiedon: new Date("2024-01-02T00:00:00Z"),
  createdby: "Creator", modifiedby: "Editor", clientdata: "invalid", connections: ["Dataverse"],
  trigger: { name: "manual", type: "Manual", label: "Manual" }, owner: { name: "Owner", email: "owner@example.com" },
};
const api = vi.hoisted(() => ({ saveFile: vi.fn(), copyToClipboard: vi.fn() }));

describe("exportUtils", () => {
  beforeEach(() => {
    api.saveFile.mockReset().mockResolvedValue(undefined);
    api.copyToClipboard.mockReset().mockResolvedValue(undefined);
    Object.assign(window, { toolboxAPI: { fileSystem: api, utils: api } });
  });

  it("generates CSV with escaped values and handles empty exports", () => {
    const csv = generateFlowDefinitionsCSVContent([flow]);
    expect(csv).toContain('"Workflow ID","Name"');
    expect(csv).toContain('"Flow | One","Line one\nLine two"');
    expect(csv).toContain('"Owner","owner@example.com"');
    expect(generateFlowDefinitionsCSVContent([])).toContain('"Workflow ID"');
  });

  it("generates escaped Markdown for Mermaid and PlantUML", () => {
    const markdown = generateFlowDefinitionsMarkdownContent([flow]);
    expect(markdown).toContain("## Flow \\| One");
    expect(markdown).toContain("Line one Line two");
    expect(markdown).toContain("```mermaid");
    expect(markdown).toContain("Error parsing JSON");
    expect(generateFlowDefinitionsMarkdownContent([flow], "plantuml")).toContain("```plantuml");
    expect(generateFlowDefinitionsMarkdownContent([], "plantuml")).toBe("# Flow Definitions\n\n");
  });

  it("saves and copies CSV and Markdown and reports success", async () => {
    const notify = vi.fn().mockResolvedValue(undefined);
    await exportFlowDefinitionsToCSV([flow], notify);
    await copyFlowDefinitionsAsCSV([flow], notify);
    await exportFlowDefinitionsToMarkdown([flow], "plantuml", notify);
    await copyFlowDefinitionsAsMarkdown([flow], notify, "mermaid");
    expect(api.saveFile).toHaveBeenCalledTimes(2);
    expect(api.copyToClipboard).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenCalledTimes(4);
    await exportFlowDefinitionsToCSV([], notify);
    await copyFlowDefinitionsAsCSV([], notify);
    await exportFlowDefinitionsToMarkdown([], "mermaid", notify);
    await copyFlowDefinitionsAsMarkdown([], notify);
    expect(notify).toHaveBeenCalledTimes(4);
  });

  it("notifies on file and clipboard errors", async () => {
    const notify = vi.fn().mockResolvedValue(undefined);
    api.saveFile.mockRejectedValue(new Error("disk unavailable"));
    api.copyToClipboard.mockRejectedValue(new Error("clipboard unavailable"));
    await exportFlowDefinitionsToCSV([flow], notify);
    await exportFlowDefinitionsToMarkdown([flow], "mermaid", notify);
    await copyFlowDefinitionsAsCSV([flow], notify);
    await copyFlowDefinitionsAsMarkdown([flow], notify);
    expect(notify.mock.calls.map(([title]) => title)).toEqual([
      "Export Failed", "Export Failed", "Copy Failed", "Copy Failed",
    ]);
  });
});
