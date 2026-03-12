import { actionTypeColors } from "./flow2mermaid/constants";
import { getActionDetails, getTriggerDetails } from "./flow2mermaid/details";
import {
  cleanStepName,
  escapeStepName,
  shortId,
  translateTypeName,
} from "./flow2mermaid/formatters";
import { topologicalSort, translateIfExpression } from "./flow2mermaid/graph";
import {
  Action,
  ActionsMap,
  MermaidResult,
  ProcessActionsResult,
  Step,
  Trigger,
} from "./flow2mermaid/types";

export type { MermaidResult } from "./flow2mermaid/types";

export const convertToMermaid = (json: string): MermaidResult => {
  const legend: Array<{ label: string; color: string; border: string }> = [
    {
      label: "Trigger",
      color: actionTypeColors.Trigger.bg,
      border: actionTypeColors.Trigger.border,
    },
    {
      label: "If/Condition",
      color: actionTypeColors.If.bg,
      border: actionTypeColors.If.border,
    },
    {
      label: "Switch",
      color: actionTypeColors.Switch.bg,
      border: actionTypeColors.Switch.border,
    },
    {
      label: "Foreach",
      color: actionTypeColors.Foreach.bg,
      border: actionTypeColors.Foreach.border,
    },
    {
      label: "Terminate",
      color: actionTypeColors.Terminate.bg,
      border: actionTypeColors.Terminate.border,
    },
    {
      label: "Action",
      color: actionTypeColors.Default.bg,
      border: actionTypeColors.Default.border,
    },
  ];

  try {
    const flow = JSON.parse(json);
    const triggers = flow.properties.definition.triggers;
    const [triggerName] = Object.keys(triggers);
    const triggerDetails = triggers[triggerName] as Trigger;
    const actionMap: ActionsMap = flow.properties.definition.actions;

    let mermaid = "graph TD;\n";
    mermaid += `${cleanStepName(triggerName)}["Trigger: ${escapeStepName(
      triggerName
    )}<br/>Type: ${translateTypeName(triggerDetails.type)}${getTriggerDetails(
      triggerDetails
    )}"]:::Trigger;\n`;
    mermaid += `style ${cleanStepName(triggerName)} fill:${actionTypeColors.Trigger.bg},stroke:${actionTypeColors.Trigger.border},stroke-width:2px;\n`;

    const processActionsResult = processActions(actionMap, {
      name: cleanStepName(triggerName),
      action: undefined,
      type: "Trigger",
    });

    mermaid += processActionsResult.mermaid;

    return { diagram: mermaid, legend };
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { diagram: "Error parsing JSON", legend: [] };
  }
};

const processActions = (
  actions: ActionsMap,
  previousStep: Step,
  label: string | undefined = undefined
): ProcessActionsResult => {
  let mermaid = "";
  const sorted = topologicalSort(actions);

  for (const element of sorted) {
    const elementCleanName = cleanStepName(element);
    const action = actions[element];

    if (action.type === "Switch" && action.cases) {
      const result = renderSwitchAction(action, previousStep, label);
      mermaid += result.mermaid;
      previousStep = result.previousStep;
      label = undefined;
      continue;
    }

    if (action.type === "If") {
      const result = renderIfAction(action, previousStep, label);
      mermaid += result.mermaid;
      previousStep = result.previousStep;
      label = undefined;
      continue;
    }

    if (action.type === "Foreach" && action.actions) {
      const result = renderForeachAction(action, element, previousStep, label);
      mermaid += result.mermaid;
      previousStep = result.previousStep;
      label = undefined;
      continue;
    }

    const result = renderStandardAction(
      action,
      element,
      elementCleanName,
      previousStep,
      label
    );
    mermaid += result.mermaid;
    previousStep = result.previousStep;
    label = undefined;
  }

  return { mermaid, lastStep: previousStep.name };
};

const renderSwitchAction = (
  action: Action,
  previousStep: Step,
  label: string | undefined
): { mermaid: string; previousStep: Step } => {
  const id = shortId();
  const switchStepStart = `Switch_Start_${id}`;
  const switchEndStep = `Switch_End_${id}`;
  let mermaid = "";

  if (previousStep.name) {
    mermaid += `${previousStep.name} --> ${switchStepStart}["Switch - Start<br/>${action.expression}"];`;
  } else {
    mermaid += `${label ? "|" + label + "|" : ""}${switchStepStart}["Switch - Start<br/>${action.expression}"];`;
  }

  mermaid += `style ${switchStepStart} fill:${actionTypeColors.Switch.bg},stroke:${actionTypeColors.Switch.border},stroke-width:2px;`;

  Object.entries(action.cases ?? {}).forEach(([caseName, caseAction]) => {
    const caseStepName = caseAction.case || caseName;
    if (caseAction.actions) {
      const processActionsResult = processActions(
        caseAction.actions,
        { name: switchStepStart, action: undefined, type: "Switch" },
        caseStepName
      );
      mermaid += processActionsResult.mermaid;
      mermaid += `${processActionsResult.lastStep} --> ${switchEndStep}["Switch - End"];`;
      mermaid += `style ${switchEndStep} fill:${actionTypeColors.Switch.bg},stroke:${actionTypeColors.Switch.border},stroke-width:2px;`;
    }
  });

  return {
    mermaid,
    previousStep: { name: switchEndStep, action: undefined, type: "Switch" },
  };
};

const renderIfAction = (
  action: Action,
  previousStep: Step,
  label: string | undefined
): { mermaid: string; previousStep: Step } => {
  const id = shortId();
  const conditionStepStart = `Condition_Start_${id}`;
  const conditionEndStep = `Condition_End_${id}`;
  let mermaid = "";

  if (previousStep.name) {
    mermaid += `${previousStep.name} --> ${
      label ? "|" + label + "|" : ""
    }${conditionStepStart}["Condition - Start<br/>${translateIfExpression(
      action.expression
    )}"];`;
  } else {
    mermaid += `${conditionStepStart}["Condition - Start<br/>${translateIfExpression(
      action.expression
    )}"];`;
  }

  mermaid += `style ${conditionStepStart} fill:${actionTypeColors.If.bg},stroke:${actionTypeColors.If.border},stroke-width:2px;`;

  if (action.actions) {
    const trueResult = processActions(
      action.actions,
      { name: conditionStepStart, action: undefined, type: "If" },
      "true"
    );
    mermaid += trueResult.mermaid;
    if (trueResult.lastStep) {
      mermaid += `${trueResult.lastStep} --> ${conditionEndStep}["Condition - End"];`;
      mermaid += `style ${conditionEndStep} fill:${actionTypeColors.If.bg},stroke:${actionTypeColors.If.border},stroke-width:2px;`;
    }
  } else {
    mermaid += `${conditionStepStart} --> |true|${conditionEndStep}["Condition - End"];`;
    mermaid += `style ${conditionEndStep} fill:${actionTypeColors.If.bg},stroke:${actionTypeColors.If.border},stroke-width:2px;`;
  }

  if (action.else?.actions) {
    const falseResult = processActions(
      action.else.actions,
      { name: conditionStepStart, action: undefined, type: "If" },
      "false"
    );
    mermaid += falseResult.mermaid;
    if (falseResult.lastStep) {
      mermaid += `${falseResult.lastStep} --> ${conditionEndStep}["Condition - End"];`;
    }
  } else {
    mermaid += `${conditionStepStart} --> |false|${conditionEndStep}["Condition - End"];`;
  }

  return {
    mermaid,
    previousStep: { name: conditionEndStep, action: undefined, type: "If" },
  };
};

const renderForeachAction = (
  action: Action,
  element: string,
  previousStep: Step,
  label: string | undefined
): { mermaid: string; previousStep: Step } => {
  const id = shortId();
  const foreachStepStart = `Foreach_Start_${id}`;
  let mermaid = "";

  if (previousStep.name) {
    mermaid += `${previousStep.name} --> ${
      label ? "|" + label + "|" : ""
    }${foreachStepStart};`;
  } else {
    mermaid += `${foreachStepStart};`;
  }

  mermaid += `style ${foreachStepStart} fill:${actionTypeColors.Foreach.bg},stroke:${actionTypeColors.Foreach.border},stroke-width:2px;`;
  mermaid += `subgraph ${foreachStepStart}["${translateTypeName(action.type)}: ${escapeStepName(
    element
  )}"];`;

  const processActionsResult = processActions(action.actions!, {
    name: undefined,
    action,
    type: "Foreach",
  });

  mermaid += processActionsResult.mermaid;
  mermaid += "end;";

  return {
    mermaid,
    previousStep: { name: foreachStepStart, action: undefined, type: "Foreach" },
  };
};

const renderStandardAction = (
  action: Action,
  element: string,
  elementCleanName: string,
  previousStep: Step,
  label: string | undefined
): { mermaid: string; previousStep: Step } => {
  const actionDetails = getActionDetails(action);
  const color =
    action.type === "Terminate"
      ? actionTypeColors.Terminate
      : actionTypeColors[action.type] || actionTypeColors.Default;
  const stepLabel = `${translateTypeName(action.type)}: ${escapeStepName(element)}${
    actionDetails ? "<br/>" + actionDetails : ""
  }`;

  let mermaid = "";
  if (previousStep.name) {
    mermaid += `${cleanStepName(previousStep.name)} --> ${
      label ? "|" + label + "|" : ""
    }${elementCleanName}["${stepLabel}"];`;
  } else {
    mermaid += `${label ? "|" + label + "|" : ""}${elementCleanName}["${stepLabel}"];`;
  }

  mermaid += `style ${elementCleanName} fill:${color.bg},stroke:${color.border},stroke-width:2px;`;

  if (action.actions) {
    const processActionsResult = processActions(action.actions, {
      name: elementCleanName,
      action,
      type: action.type,
    });
    mermaid += processActionsResult.mermaid;
    return {
      mermaid,
      previousStep: {
        name: processActionsResult.lastStep,
        action: undefined,
        type: action.type,
      },
    };
  }

  if (action.type === "Terminate") {
    return {
      mermaid,
      previousStep: { name: undefined, action: undefined },
    };
  }

  return {
    mermaid,
    previousStep: { name: elementCleanName, action, type: action.type },
  };
};
