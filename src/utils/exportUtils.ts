import { FLowDefinition } from "../types/flowDefinition";
import { logger } from "../services/loggerService";
import { convertToMermaid } from "./Flow2MermaidConverter";

type ShowNotificationFn = (
  title: string,
  body: string,
  type: "success" | "info" | "warning" | "error"
) => Promise<void>;

/**
 * Exports flow definitions to a CSV file
 */
export const exportFlowDefinitionsToCSV = async (
  flows: FLowDefinition[],
  showNotification?: ShowNotificationFn
): Promise<void> => {
  if (!flows || flows.length === 0) {
    logger.warning("No flow definitions to export");
    return;
  }

  try {
    const csvContent = generateFlowDefinitionsCSVContent(flows);
    const defaultFilename = `flow_definitions_${new Date().toISOString().split('T')[0]}.csv`;

    await window.toolboxAPI.utils.saveFile(defaultFilename, csvContent);

    logger.success(`Exported ${flows.length} flow definitions`);
    if (showNotification) {
      await showNotification(
        "Export Successful",
        `Exported ${flows.length} flow definitions to ${defaultFilename}`,
        "success"
      );
    }
  } catch (error) {
    logger.error(`Error exporting data: ${(error as Error).message}`);
    if (showNotification) {
      await showNotification(
        "Export Failed",
        `Error exporting data: ${(error as Error).message}`,
        "error"
      );
    }
  }
};

/**
 * Copies flow definitions to clipboard as CSV
 */
export const copyFlowDefinitionsAsCSV = async (
  flows: FLowDefinition[],
  showNotification?: ShowNotificationFn
): Promise<void> => {
  if (!flows || flows.length === 0) {
    logger.warning("No flow definitions to copy");
    return;
  }

  try {
    const csvContent = generateFlowDefinitionsCSVContent(flows);

    await window.toolboxAPI.utils.copyToClipboard(csvContent);

    logger.success(
      `Copied ${flows.length} flow definitions to clipboard (CSV)`
    );
    if (showNotification) {
      await showNotification(
        "Copy Successful",
        `Copied ${flows.length} flow definitions to clipboard as CSV`,
        "success"
      );
    }
  } catch (error) {
    logger.error(`Error copying to clipboard: ${(error as Error).message}`);
    if (showNotification) {
      await showNotification(
        "Copy Failed",
        `Error copying to clipboard: ${(error as Error).message}`,
        "error"
      );
    }
  }
};

/**
 * Copies flow definitions to clipboard as Mermaid diagrams
 */
export const copyFlowDefinitionsAsMermaid = async (
  flows: FLowDefinition[],
  showNotification?: ShowNotificationFn
): Promise<void> => {
  if (!flows || flows.length === 0) {
    logger.warning("No flow definitions to copy");
    return;
  }

  try {
    let mermaidContent = "";
    
    flows.forEach((flow, index) => {
      if (flow.clientdata) {
        mermaidContent += `## ${flow.name}\n\n`;
        mermaidContent += "```mermaid\n";
        mermaidContent += convertToMermaid(flow.clientdata);
        mermaidContent += "\n```\n\n";
        
        if (index < flows.length - 1) {
          mermaidContent += "---\n\n";
        }
      }
    });

    await window.toolboxAPI.utils.copyToClipboard(mermaidContent);

    logger.success(
      `Copied ${flows.length} flow definitions to clipboard (Mermaid)`
    );
    if (showNotification) {
      await showNotification(
        "Copy Successful",
        `Copied ${flows.length} flow definitions to clipboard as Mermaid`,
        "success"
      );
    }
  } catch (error) {
    logger.error(`Error copying to clipboard: ${(error as Error).message}`);
    if (showNotification) {
      await showNotification(
        "Copy Failed",
        `Error copying to clipboard: ${(error as Error).message}`,
        "error"
      );
    }
  }
};

/**
 * Generates CSV content from flow definitions
 */
function generateFlowDefinitionsCSVContent(flows: FLowDefinition[]): string {
  const headers = [
    "Workflow ID",
    "Name",
    "Description",
    "State",
    "Created On",
    "Modified On",
  ];
  const csvRows = [headers.join(",")];

  flows.forEach((flow) => {
    const stateText = flow.statecode === 0 ? "Draft" : flow.statecode === 1 ? "Active" : "Inactive";
    const row = [
      `"${flow.workflowid.replace(/"/g, '""')}"`,
      `"${flow.name.replace(/"/g, '""')}"`,
      `"${(flow.description || "").replace(/"/g, '""')}"`,
      `"${stateText}"`,
      `"${new Date(flow.createdon).toLocaleString()}"`,
      `"${new Date(flow.modifiedon).toLocaleString()}"`,
    ];
    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}
