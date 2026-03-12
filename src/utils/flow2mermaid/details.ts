import { escapeMermaidText, translateApiName } from "./formatters";
import { Action, Trigger } from "./types";

const translateDataverseParamValue = (key: string, value: any): string => {
  const baseKey = key.replace(/^(subscriptionRequest|emailMessage|item|http|odata)\//i, "");

  if (typeof value === "number") {
    if (baseKey === "message") {
      const msgTypes: Record<number, string> = {
        1: "Created",
        2: "Modified",
        3: "Deleted",
        4: "CreatedModified",
        5: "CreatedDeleted",
        6: "ModifiedDeleted",
        7: "All",
      };
      return msgTypes[value] || String(value);
    }

    if (baseKey === "scope") {
      const scopeTypes: Record<number, string> = {
        1: "User",
        2: "Parent",
        3: "BusinessUnit",
        4: "Organization",
        5: "None",
      };
      return scopeTypes[value] || String(value);
    }

    if (baseKey === "runas") {
      const runAsTypes: Record<number, string> = {
        1: "Owner",
        2: "CallingUser",
      };
      return runAsTypes[value] || String(value);
    }

    if (baseKey === "importance") {
      const importanceTypes: Record<number, string> = {
        0: "Normal",
        1: "High",
        2: "Low",
      };
      return importanceTypes[value] || String(value);
    }
  }

  if (typeof value === "string") {
    return escapeMermaidText(value);
  }

  return String(value);
};

const formatParamKey = (key: string): string => {
  return key
    .replace(/^(subscriptionRequest|emailMessage|item|http|odata)\//i, "")
    .replace(/^\$/g, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
};

const getConnectorDisplayName = (host?: {
  connectionName?: string;
  apiId?: string;
}): string => {
  if (!host) return "unknown";

  const apiName = host.apiId ? translateApiName(host.apiId.split("/").pop() || "") : "";
  const connectionName = escapeMermaidText(host.connectionName)?.replace(/^shared_/, "") || "";

  return apiName || connectionName || "unknown";
};

const formatParamValue = (key: string, value: any, isDataverse: boolean): string => {
  if (isDataverse) {
    return translateDataverseParamValue(key, value);
  }

  if (typeof value === "string") {
    return escapeMermaidText(value);
  }

  return String(value);
};

export const getActionDetails = (action: Action): string => {
  const details: string[] = [];
  const apiId = action.inputs?.host?.apiId || "";
  const isDataverse = apiId.includes("commondataserviceforapps");

  if (action.inputs) {
    if (action.inputs.host) {
      details.push(`Host: ${getConnectorDisplayName(action.inputs.host)}`);
    }

    if (action.inputs.method) {
      details.push(`Method: ${action.inputs.method}`);
    }

    if (action.inputs.uri) {
      details.push(`URI: ${escapeMermaidText(action.inputs.uri)}`);
    }

    if (action.inputs.queries) {
      Object.entries(action.inputs.queries)
        .filter(([key]) => !key.startsWith("$"))
        .forEach(([key, value]) => {
          details.push(`Query ${formatParamKey(key)}: ${formatParamValue(key, value, isDataverse)}`);
        });
    }

    if (action.inputs.body) {
      details.push(`Body: ${escapeMermaidText(JSON.stringify(action.inputs.body))}`);
    }

    if (action.inputs.parameters) {
      Object.entries(action.inputs.parameters)
        .filter(([key]) => !key.startsWith("$"))
        .forEach(([key, value]) => {
          details.push(`${formatParamKey(key)}: ${formatParamValue(key, value, isDataverse)}`);
        });
    }
  }

  return details.length > 0 ? details.join("<br/>") : "";
};

export const getTriggerDetails = (trigger: Trigger): string => {
  const details: string[] = [];
  const apiId = trigger.inputs?.host?.apiId || "";
  const isDataverse = apiId.includes("commondataserviceforapps");

  if (trigger.inputs?.host) {
    details.push(`Connection: ${getConnectorDisplayName(trigger.inputs.host)}`);
  }

  if (trigger.inputs?.parameters) {
    Object.entries(trigger.inputs.parameters)
      .filter(([key]) => !key.startsWith("$"))
      .forEach(([key, value]) => {
        details.push(`${formatParamKey(key)}: ${formatParamValue(key, value, isDataverse)}`);
      });
  }

  return details.length > 0 ? `<br/>${details.join("<br/>")}` : "";
};
