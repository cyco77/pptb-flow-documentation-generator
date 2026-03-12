export interface Action {
  runAfter?: Record<string, string[]>;
  foreach?: string;
  actions?: ActionsMap;
  cases?: Record<string, Action>;
  case?: string;
  else?: Action;
  expression?: ExpressionMap;
  metadata: {
    operationMetadataId: string;
  };
  type: string;
  inputs?: any;
}

export interface Trigger {
  splitOn: string;
  metadata: {
    operationMetadataId: string;
  };
  type: string;
  inputs: {
    host: {
      connectionName: string;
      operationId: string;
      apiId: string;
    };
    parameters: Record<string, string | number | boolean>;
    authentication: string;
  };
}

export interface Step {
  name: string | undefined;
  action: Action | undefined;
  type?: string;
}

export interface MermaidResult {
  diagram: string;
  legend: Array<{ label: string; color: string; border: string }>;
}

export type ProcessActionsResult = {
  mermaid: string;
  lastStep: string | undefined;
};

export type ActionsMap = Record<string, Action>;
export type ExpressionMap = Record<string, []>;
