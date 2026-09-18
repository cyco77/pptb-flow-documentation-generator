import { getTriggerLabel } from "./flow2mermaid/formatters";
import { translateApiName } from "./flow2mermaid/formatters";

type JsonRecord = Record<string, any>;

export type FlowMetadata = {
  trigger?: { name: string; type: string; label: string };
  connections: string[];
};

export const extractFlowMetadata = (clientdata?: string): FlowMetadata => {
  if (!clientdata) return { connections: [] };

  try {
    const flow = JSON.parse(clientdata) as JsonRecord;
    const definition = flow?.properties?.definition as JsonRecord | undefined;
    const triggers = definition?.triggers as JsonRecord | undefined;
    const triggerName = triggers ? Object.keys(triggers)[0] : undefined;
    const trigger = triggerName ? triggers?.[triggerName] : undefined;
    const connectionNames = new Set<string>();

    const visit = (value: unknown): void => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      const record = value as JsonRecord;
      const host = record.host as JsonRecord | undefined;
      const apiId = typeof host?.apiId === "string" ? host.apiId : "";
      const connectionName = typeof host?.connectionName === "string" ? host.connectionName : "";
      const connector = apiId.split("/").pop() || connectionName;
      if (connector) connectionNames.add(translateApiName(connector));
      Object.values(record).forEach(visit);
    };
    visit(definition);

    return {
      trigger:
        triggerName && typeof trigger?.type === "string"
          ? { name: triggerName, type: trigger.type, label: getTriggerLabel(trigger.type) }
          : undefined,
      connections: [...connectionNames].sort((a, b) => a.localeCompare(b)),
    };
  } catch {
    return { connections: [] };
  }
};
