import { apiNameTranslations, typeNameTranslations } from "./constants";

export const translateApiName = (apiName: string): string => {
  return apiNameTranslations[apiName] || apiName.replace(/^shared_/, "");
};

export const translateTypeName = (typeName: string): string => {
  return typeNameTranslations[typeName] || typeName;
};

export function cleanStepName(stepName: string | undefined): string {
  if (!stepName) return "";
  return stepName.replace(/[^a-zA-Z0-9_]/g, "_");
}

export function escapeStepName(stepName: string | undefined): string {
  if (!stepName) return "";
  return stepName.replace(/"/g, "");
}

export function escapeMermaidText(text: string | undefined): string {
  if (!text) return "";

  return text
    .replace(/"/g, "'")
    .replace(/@{/g, "")
    .replace(/}/g, "")
    .replace(/\?/g, "")
    .replace(/'/g, "")
    .substring(0, 40);
}

export function shortId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
}
