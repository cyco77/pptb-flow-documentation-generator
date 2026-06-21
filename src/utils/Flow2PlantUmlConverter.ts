import { getActionDetails, getTriggerDetails } from "./flow2mermaid/details";
import { topologicalSort, translateIfExpression } from "./flow2mermaid/graph";
import { translateTypeName } from "./flow2mermaid/formatters";
import { Action, ActionsMap, Trigger } from "./flow2mermaid/types";

export interface PlantUmlResult {
  diagram: string;
}

const sanitizeText = (text: string | undefined): string => {
  if (!text) {
    return "";
  }

  return text
    .replace(/\r?\n/g, " ")
    .replace(/\"/g, "'")
    .replace(/[{}]/g, "")
    .trim();
};

const formatDetails = (details: string): string => {
  const cleaned = details
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((part) => sanitizeText(part))
    .filter(Boolean)
    .join("\\n");

  return cleaned;
};

const formatExpression = (expression: Action["expression"]): string => {
  const translated = translateIfExpression(expression)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitizeText(translated) || "condition";
};

const buildActionLabel = (name: string, action: Action): string => {
  const baseLabel = `${translateTypeName(action.type)}: ${sanitizeText(name)}`;
  const details = formatDetails(getActionDetails(action));

  if (!details) {
    return baseLabel;
  }

  return `${baseLabel}\\n${details}`;
};

const processActions = (actions: ActionsMap, lines: string[]) => {
  const sorted = topologicalSort(actions);

  for (const actionName of sorted) {
    const action = actions[actionName];

    if (action.type === "If") {
      renderIfAction(action, lines);
      continue;
    }

    if (action.type === "Switch") {
      renderSwitchAction(action, lines);
      continue;
    }

    if (action.type === "Foreach") {
      renderForeachAction(actionName, action, lines);
      continue;
    }

    renderStandardAction(actionName, action, lines);
  }
};

const renderIfAction = (action: Action, lines: string[]) => {
  const condition = formatExpression(action.expression);

  lines.push(`if (${condition}?) then (true)`);

  if (action.actions && Object.keys(action.actions).length > 0) {
    processActions(action.actions, lines);
  } else {
    lines.push(":No true-branch actions;");
  }

  lines.push("else (false)");

  if (action.else?.actions && Object.keys(action.else.actions).length > 0) {
    processActions(action.else.actions, lines);
  } else {
    lines.push(":No false-branch actions;");
  }

  lines.push("endif");
};

const renderSwitchAction = (action: Action, lines: string[]) => {
  const expression = formatExpression(action.expression);
  const cases = Object.entries(action.cases ?? {});

  if (cases.length === 0) {
    lines.push(`:Switch: ${expression};`);
    lines.push(":No cases defined;");
    return;
  }

  cases.forEach(([caseName, caseAction], index) => {
    const caseLabel =
      sanitizeText(caseAction.case || caseName) || `case-${index + 1}`;
    const caseCondition = `case == ${caseLabel}`;

    if (index === 0) {
      lines.push(`if (${caseCondition}) then (${caseLabel})`);
    } else {
      lines.push(`elseif (${caseCondition}) then (${caseLabel})`);
    }

    if (caseAction.actions && Object.keys(caseAction.actions).length > 0) {
      processActions(caseAction.actions, lines);
    } else {
      lines.push(`:No actions for ${caseLabel};`);
    }
  });

  lines.push("else (other)");
  lines.push(`:No matching switch case for ${expression};`);
  lines.push("endif");
};

const renderForeachAction = (
  actionName: string,
  action: Action,
  lines: string[],
) => {
  const foreachSource = sanitizeText(action.foreach) || "items";
  const foreachLabel = sanitizeText(actionName);

  lines.push(
    `while (Foreach: ${foreachLabel} from ${foreachSource}) is (next)`,
  );

  if (action.actions && Object.keys(action.actions).length > 0) {
    processActions(action.actions, lines);
  } else {
    lines.push(":No loop actions;");
  }

  lines.push("endwhile");
};

const renderStandardAction = (
  actionName: string,
  action: Action,
  lines: string[],
) => {
  lines.push(`:${buildActionLabel(actionName, action)};`);

  if (action.actions && Object.keys(action.actions).length > 0) {
    processActions(action.actions, lines);
  }

  if (action.type === "Terminate") {
    lines.push("stop");
  }
};

export const convertToPlantUml = (json: string): PlantUmlResult => {
  try {
    const flow = JSON.parse(json);
    const triggers = flow.properties.definition.triggers;
    const [triggerName] = Object.keys(triggers);
    const triggerDetails = triggers[triggerName] as Trigger;
    const actions: ActionsMap = flow.properties.definition.actions;

    const triggerInfo = formatDetails(getTriggerDetails(triggerDetails));
    const triggerLabel =
      `Trigger: ${sanitizeText(triggerName)}\\nType: ${translateTypeName(triggerDetails.type)}` +
      (triggerInfo ? `\\n${triggerInfo}` : "");

    const lines: string[] = [
      "@startuml",
      "skinparam shadowing false",
      "start",
      `:${triggerLabel};`,
    ];

    processActions(actions, lines);

    lines.push("stop");
    lines.push("@enduml");

    return { diagram: lines.join("\n") };
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { diagram: "Error parsing JSON" };
  }
};
