import { mapFlowDefinitions } from "../mappers/flowDefinitionMapper";
import { FLowDefinition } from "../types/flowDefinition";
import { logger } from "./loggerService";

export const loadFlowDefinitions = async (): Promise<FLowDefinition[]> => {
  let url =
    "/workflows?$filter=(category eq 5 and iscustomizable/Value eq true)&$select=name,description,workflowid,createdon,modifiedon,clientdata,statecode,iscustomizable";

  const allRecords = await loadAllData(url);

  return mapFlowDefinitions(allRecords);
};

const loadAllData = async (fullUrl: string) => {
  const allRecords = [];

  while (fullUrl) {
    logger.info(`Fetching data from URL: ${fullUrl}`);

    let relativePath = fullUrl;

    if (fullUrl.startsWith("http")) {
      const url = new URL(fullUrl);
      const apiRegex = /^\/api\/data\/v\d+\.\d+\//;
      relativePath = url.pathname.replace(apiRegex, "") + url.search;
    }

    logger.info(`Cleaned URL: ${relativePath}`);

    const response = await window.dataverseAPI.queryData(relativePath);

    // Add the current page of results
    allRecords.push(...response.value);

    // Check for paging link
    fullUrl = (response as any)["@odata.nextLink"] || null;
  }

  return allRecords;
};
