export type FLowDefinition = {
  workflowid: string;
  name: string;
  description?: string;
  createdon: Date;
  modifiedon: Date;
  createdby?: string;
  modifiedby?: string;
  clientdata?: string;
  statecode: number;
  trigger?: {
    name: string;
    type: string;
    label: string;
  };
  connections: string[];
  owner?: {
    name?: string;
    email?: string;
  };
  solution?: string;
  publisher?: string;
};
