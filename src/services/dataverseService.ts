import { mapFlowDefinitions } from "../mappers/flowDefinitionMapper";
import { FLowDefinition } from "../types/flowDefinition";
import { logger } from "./loggerService";

export type SolutionFilterOption = {
  id: string;
  name: string;
  publisherId?: string;
  publisherName?: string;
};

export type SolutionPublisherCatalog = {
  solutions: SolutionFilterOption[];
  publishers: string[];
};

/** Loads only the small catalog needed to populate the filters on startup. */
export const loadSolutionPublisherCatalog = async (): Promise<SolutionPublisherCatalog> => {
  const [solutionsResponse, publishers] = await Promise.all([
    window.dataverseAPI.getSolutions(["solutionid", "friendlyname", "_publisherid_value"]),
    loadAllData("/publishers?$select=publisherid,friendlyname"),
  ]);

  const publisherNames = new Map(
    publishers.map((publisher) => [String(publisher["publisherid"]), String(publisher["friendlyname"] || "")]),
  );
  const solutions = solutionsResponse.value
    .map((solution) => {
      const publisherId = typeof solution["_publisherid_value"] === "string" ? solution["_publisherid_value"] : undefined;
      return {
        id: String(solution["solutionid"]),
        name: String(solution["friendlyname"] || solution["solutionid"]),
        publisherId,
        publisherName: publisherId ? publisherNames.get(publisherId) : undefined,
      };
    })
    .filter((solution) => solution.id && solution.name);

  return {
    solutions: solutions.sort((a, b) => a.name.localeCompare(b.name)),
    publishers: [...new Set(solutions.map((solution) => solution.publisherName).filter(Boolean) as string[])].sort(),
  };
};

/** Loads the plain workflow list without resolving solution components. */
export const loadFlowDefinitions = async (): Promise<FLowDefinition[]> => {
  const workflowRecords = await loadAllData(
    "/workflows?$select=name,description,workflowid,createdon,modifiedon,createdby,modifiedby,_createdby_value,_modifiedby_value,clientdata,statecode,iscustomizable,_ownerid_value,ownerid&$filter=category eq 5 and iscustomizable/Value eq true",
  );
  return mapFlowDefinitions(workflowRecords);
};

/** Resolves workflows from selected solutions only. */
export const loadFlowDefinitionsForSolutions = async (
  solutionIds: string[],
  catalog: SolutionFilterOption[],
): Promise<FLowDefinition[]> => {
  if (solutionIds.length === 0) return [];
  const components = await loadBatchedData(
    solutionIds,
    50,
    (batch) =>
      `/solutioncomponents?$select=objectid,_solutionid_value&$filter=${batch
        .map((id) => `_solutionid_value eq ${id}`)
        .join(" or ")}`,
  );

  const workflowIds = [...new Set(components.map((component) => component["objectid"]).filter((id): id is string => typeof id === "string"))];
  if (workflowIds.length === 0) return [];
  const solutionById = new Map(catalog.map((solution) => [solution.id, solution]));
  const metadataByWorkflow = new Map<string, { solutions: Set<string>; publishers: Set<string> }>();

  for (const component of components) {
    const workflowId = component["objectid"];
    const solutionId = component["_solutionid_value"];
    if (typeof workflowId !== "string") continue;
    const solution = solutionById.get(String(solutionId));
    const metadata = metadataByWorkflow.get(workflowId) || { solutions: new Set<string>(), publishers: new Set<string>() };
    if (solution) {
      metadata.solutions.add(solution.name);
      if (solution.publisherName) metadata.publishers.add(solution.publisherName);
    }
    metadataByWorkflow.set(workflowId, metadata);
  }

  const records = await loadBatchedData(
    workflowIds,
    50,
    (batch) =>
      `/workflows?$select=name,description,workflowid,createdon,modifiedon,createdby,modifiedby,_createdby_value,_modifiedby_value,clientdata,statecode,iscustomizable,_ownerid_value,ownerid&$filter=category eq 5 and iscustomizable/Value eq true and (${batch
        .map((id) => `workflowid eq ${id}`)
        .join(" or ")})`,
  );
  for (const record of records) {
    const metadata = metadataByWorkflow.get(String(record["workflowid"]));
    if (metadata) {
      record["solutionname"] = [...metadata.solutions].join("; ");
      record["publishername"] = [...metadata.publishers].join("; ");
    }
  }

  return mapFlowDefinitions(records);
};

const loadBatchedData = async (
  ids: string[],
  batchSize: number,
  createQuery: (batch: string[]) => string,
): Promise<Record<string, unknown>[]> => {
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += batchSize) {
    batches.push(ids.slice(index, index + batchSize));
  }

  const results = await Promise.all(batches.map((batch) => loadAllData(createQuery(batch))));
  return results.flat();
};

const loadAllData = async (fullUrl: string): Promise<Record<string, unknown>[]> => {
  const allRecords: Record<string, unknown>[] = [];
  while (fullUrl) {
    logger.info(`Fetching data from URL: ${fullUrl}`);
    let relativePath = fullUrl;
    if (fullUrl.startsWith("http")) {
      const url = new URL(fullUrl);
      relativePath = url.pathname.replace(/^\/api\/data\/v\d+\.\d+\//, "") + url.search;
    }
    const response = await window.dataverseAPI.queryData(relativePath);
    allRecords.push(...response.value);
    fullUrl = (response as { "@odata.nextLink"?: string })["@odata.nextLink"] || "";
  }
  return allRecords;
};
