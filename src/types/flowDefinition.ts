export type FLowDefinition = {
  workflowid: string;
  name: string;
  description?: string;
  createdon: Date;
  modifiedon: Date;
  clientdata?: string;
  statecode: number;
};
