import { FLowDefinition } from "../types/flowDefinition";
import { extractFlowMetadata } from "../utils/flowMetadata";

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
    const createdby = item["createdbyname"] ?? item["_createdby_value@OData.Community.Display.V1.FormattedValue"];
    const modifiedby = item["modifiedbyname"] ?? item["_modifiedby_value@OData.Community.Display.V1.FormattedValue"];
    const clientdata = item["clientdata"];
    const statecode = item["statecode"];
    const metadata = extractFlowMetadata(typeof clientdata === "string" ? clientdata : undefined);
    const owner = item["ownerid"] as Record<string, unknown> | undefined;
    const ownerName = item["ownername"] ?? owner?.["fullname"] ?? item["_ownerid_value@OData.Community.Display.V1.FormattedValue"];
    const ownerEmail = item["owneremail"] ?? owner?.["internalemailaddress"];
    const solution = item["solutionname"];
    const publisher = item["publishername"];

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
        createdby: typeof createdby === "string" ? createdby : undefined,
        modifiedby: typeof modifiedby === "string" ? modifiedby : undefined,
        clientdata: clientdata === null ? undefined : clientdata,
        statecode,
        ...metadata,
        owner: ownerName || ownerEmail ? { name: typeof ownerName === "string" ? ownerName : undefined, email: typeof ownerEmail === "string" ? ownerEmail : undefined } : undefined,
        solution: typeof solution === "string" ? solution : undefined,
        publisher: typeof publisher === "string" ? publisher : undefined,
      });
    }
  });

  return results;
};
