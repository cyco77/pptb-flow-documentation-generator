import { FLowDefinition } from "../types/flowDefinition";
import { logger } from "../services/loggerService";
import { convertToMermaid } from "./Flow2MermaidConverter";
import { convertToPlantUml } from "./Flow2PlantUmlConverter";

type ShowNotificationFn = (title: string, body: string, type: "success" | "info" | "warning" | "error") => Promise<void>;
export type DiagramFormat = "mermaid" | "plantuml";

const stateLabel = (statecode: number) => statecode === 0 ? "Draft" : statecode === 1 ? "Active" : "Inactive";
const csv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const ownerName = (flow: FLowDefinition) => [flow.owner?.name, flow.owner?.email].filter(Boolean).join(" (") + (flow.owner?.name && flow.owner?.email ? ")" : "");
const triggerTechnical = (flow: FLowDefinition) => flow.trigger ? `${flow.trigger.name} (${flow.trigger.type})` : "";

export const generateFlowDefinitionsCSVContent = (flows: FLowDefinition[]): string => {
  const headers = ["Workflow ID", "Name", "Description", "State", "Trigger", "Trigger Type", "Connections", "Owner Name", "Owner Email", "Created By", "Modified By", "Created On", "Modified On"];
  const rows = flows.map((flow) => [
    flow.workflowid, flow.name, flow.description, stateLabel(flow.statecode), flow.trigger?.label,
    triggerTechnical(flow), flow.connections.join("; "), flow.owner?.name, flow.owner?.email,
    flow.createdby, flow.modifiedby, new Date(flow.createdon).toLocaleString(), new Date(flow.modifiedon).toLocaleString(),
  ].map(csv).join(","));
  return [headers.map(csv).join(","), ...rows].join("\n");
};

export const exportFlowDefinitionsToCSV = async (flows: FLowDefinition[], showNotification?: ShowNotificationFn) => {
  if (!flows.length) return;
  try {
    const filename = `flow_definitions_${new Date().toISOString().split("T")[0]}.csv`;
    await window.toolboxAPI.fileSystem.saveFile(filename, generateFlowDefinitionsCSVContent(flows));
    await showNotification?.("Export Successful", `Exported ${flows.length} flow definitions`, "success");
  } catch (error) {
    logger.error(`Error exporting data: ${(error as Error).message}`);
    await showNotification?.("Export Failed", `Error exporting data: ${(error as Error).message}`, "error");
  }
};

export const copyFlowDefinitionsAsCSV = async (flows: FLowDefinition[], showNotification?: ShowNotificationFn) => {
  if (!flows.length) return;
  try {
    await window.toolboxAPI.utils.copyToClipboard(generateFlowDefinitionsCSVContent(flows));
    await showNotification?.("Copy Successful", `Copied ${flows.length} flow definitions as CSV`, "success");
  } catch (error) {
    await showNotification?.("Copy Failed", `Error copying data: ${(error as Error).message}`, "error");
  }
};

const markdownValue = (value: unknown) => String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const removeMermaidFormatting = (diagram: string) => diagram
  .replace(/:::[\w-]+/g, "")
  .replace(/^\s*style\s+.*(?:\r?\n|$)/gm, "")
  .trimEnd();

export const generateFlowDefinitionsMarkdownContent = (flows: FLowDefinition[], format: DiagramFormat = "mermaid"): string => {
  const language = format === "mermaid" ? "mermaid" : "plantuml";
  return `# Flow Definitions\n\n${flows.map((flow) => {
    const diagram = format === "mermaid"
      ? removeMermaidFormatting(convertToMermaid(flow.clientdata || "").diagram)
      : convertToPlantUml(flow.clientdata || "").diagram;
    return `## ${markdownValue(flow.name)}\n\n| Property | Value |\n|---|---|\n| Description | ${markdownValue(flow.description)} |\n| State | ${stateLabel(flow.statecode)} |\n| Trigger | ${markdownValue(flow.trigger?.label)} |\n| Trigger (technical) | ${markdownValue(triggerTechnical(flow))} |\n| Connections | ${markdownValue(flow.connections.join(", "))} |\n| Owner | ${markdownValue(ownerName(flow))} |\n| Created By | ${markdownValue(flow.createdby)} |\n| Modified By | ${markdownValue(flow.modifiedby)} |\n| Created On | ${markdownValue(new Date(flow.createdon).toLocaleString())} |\n| Modified On | ${markdownValue(new Date(flow.modifiedon).toLocaleString())} |\n\n\`\`\`${language}\n${diagram}\n\`\`\`\n`;
  }).join("\n")}`;
};

export const copyFlowDefinitionsAsMarkdown = async (flows: FLowDefinition[], showNotification?: ShowNotificationFn, format: DiagramFormat = "mermaid") => {
  if (!flows.length) return;
  try {
    await window.toolboxAPI.utils.copyToClipboard(generateFlowDefinitionsMarkdownContent(flows, format));
    await showNotification?.("Copy Successful", `Copied ${flows.length} flow definitions as Markdown`, "success");
  } catch (error) {
    await showNotification?.("Copy Failed", `Error copying Markdown: ${(error as Error).message}`, "error");
  }
};

export const exportFlowDefinitionsToMarkdown = async (flows: FLowDefinition[], format: DiagramFormat, showNotification?: ShowNotificationFn) => {
  if (!flows.length) return;
  try {
    const filename = `flow_documentation_${format}_${new Date().toISOString().split("T")[0]}.md`;
    await window.toolboxAPI.fileSystem.saveFile(filename, generateFlowDefinitionsMarkdownContent(flows, format));
    await showNotification?.("Export Successful", `Exported ${flows.length} flow definitions as Markdown`, "success");
  } catch (error) {
    await showNotification?.("Export Failed", `Error exporting Markdown: ${(error as Error).message}`, "error");
  }
};
