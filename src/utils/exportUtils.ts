import { FLowDefinition } from "../types/flowDefinition";
import { logger } from "../services/loggerService";

type ShowNotificationFn = (
  title: string,
  body: string,
  type: "success" | "info" | "warning" | "error",
) => Promise<void>;

/**
 * Exports flow definitions to a CSV file
 */
export const exportFlowDefinitionsToCSV = async (
  flows: FLowDefinition[],
  showNotification?: ShowNotificationFn,
): Promise<void> => {
  if (!flows || flows.length === 0) {
    logger.warning("No flow definitions to export");
    return;
  }

  try {
    const csvContent = generateFlowDefinitionsCSVContent(flows);
    const defaultFilename = `flow_definitions_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    await window.toolboxAPI.fileSystem.saveFile(defaultFilename, csvContent);

    logger.success(`Exported ${flows.length} flow definitions`);
    if (showNotification) {
      await showNotification(
        "Export Successful",
        `Exported ${flows.length} flow definitions to ${defaultFilename}`,
        "success",
      );
    }
  } catch (error) {
    logger.error(`Error exporting data: ${(error as Error).message}`);
    if (showNotification) {
      await showNotification(
        "Export Failed",
        `Error exporting data: ${(error as Error).message}`,
        "error",
      );
    }
  }
};

/**
 * Copies flow definitions to clipboard as CSV
 */
export const copyFlowDefinitionsAsCSV = async (
  flows: FLowDefinition[],
  showNotification?: ShowNotificationFn,
): Promise<void> => {
  if (!flows || flows.length === 0) {
    logger.warning("No flow definitions to copy");
    return;
  }

  try {
    const csvContent = generateFlowDefinitionsCSVContent(flows);

    await window.toolboxAPI.utils.copyToClipboard(csvContent);

    logger.success(
      `Copied ${flows.length} flow definitions to clipboard (CSV)`,
    );
    if (showNotification) {
      await showNotification(
        "Copy Successful",
        `Copied ${flows.length} flow definitions to clipboard as CSV`,
        "success",
      );
    }
  } catch (error) {
    logger.error(`Error copying to clipboard: ${(error as Error).message}`);
    if (showNotification) {
      await showNotification(
        "Copy Failed",
        `Error copying to clipboard: ${(error as Error).message}`,
        "error",
      );
    }
  }
};

/**
 * Copies flow definitions to clipboard as Markdown table
 */
export const copyFlowDefinitionsAsMarkdown = async (
  flows: FLowDefinition[],
  showNotification?: ShowNotificationFn,
): Promise<void> => {
  if (!flows || flows.length === 0) {
    logger.warning("No flow definitions to copy");
    return;
  }

  try {
    const markdownContent = generateFlowDefinitionsMarkdownContent(flows);

    await window.toolboxAPI.utils.copyToClipboard(markdownContent);

    logger.success(
      `Copied ${flows.length} flow definitions to clipboard (Markdown)`,
    );
    if (showNotification) {
      await showNotification(
        "Copy Successful",
        `Copied ${flows.length} flow definitions to clipboard as Markdown`,
        "success",
      );
    }
  } catch (error) {
    logger.error(`Error copying to clipboard: ${(error as Error).message}`);
    if (showNotification) {
      await showNotification(
        "Copy Failed",
        `Error copying to clipboard: ${(error as Error).message}`,
        "error",
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
    const stateText =
      flow.statecode === 0
        ? "Draft"
        : flow.statecode === 1
          ? "Active"
          : "Inactive";
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

/**
 * Generates Markdown table content from flow definitions
 */
function generateFlowDefinitionsMarkdownContent(
  flows: FLowDefinition[],
): string {
  let markdown = "# Flow Definitions\n\n";

  // Table header
  markdown += "| Name | Description | State | Created On | Modified On |\n";
  markdown += "|------|-------------|-------|------------|-------------|\n";

  // Table rows
  flows.forEach((flow) => {
    const stateText =
      flow.statecode === 0
        ? "Draft"
        : flow.statecode === 1
          ? "Active"
          : "Inactive";
    const name = flow.name.replace(/\|/g, "\\|");
    const description = (flow.description || "")
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");
    const createdOn = new Date(flow.createdon).toLocaleDateString();
    const modifiedOn = new Date(flow.modifiedon).toLocaleDateString();

    markdown += `| ${name} | ${description} | ${stateText} | ${createdOn} | ${modifiedOn} |\n`;
  });

  return markdown;
}
