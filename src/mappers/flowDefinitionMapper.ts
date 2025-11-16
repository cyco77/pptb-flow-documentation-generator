import { FLowDefinition } from "../types/flowDefinition";

export const mapFlowDefinitions = (
  rawData: Record<string, unknown>[]
): FLowDefinition[] => {
  const results: FLowDefinition[] = [];

  rawData.forEach((item) => {
    const id = item["workflowid"];
    const name = item["name"];
    const description = item["description"];
    const createdon = item["createdon"];
    const modifiedon = item["modifiedon"];
    const clientdata = item["clientdata"];
    const statecode = item["statecode"];

    // Validate and cast
    if (
      typeof id === "string" &&
      typeof name === "string" &&
      (createdon instanceof Date || typeof createdon === "string") &&
      (modifiedon instanceof Date || typeof modifiedon === "string") &&
      (description === undefined ||
        description === null ||
        typeof description === "string") &&
      (clientdata === undefined ||
        clientdata === null ||
        typeof clientdata === "string") &&
      typeof statecode === "number"
    ) {
      results.push({
        workflowid: id,
        name,
        description: description === null ? undefined : description,
        createdon: createdon instanceof Date ? createdon : new Date(createdon),
        modifiedon:
          modifiedon instanceof Date ? modifiedon : new Date(modifiedon),
        clientdata: clientdata === null ? undefined : clientdata,
        statecode,
      });
    }
  });

  return results;
};
