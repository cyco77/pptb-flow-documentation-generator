import { describe, expect, it } from "vitest";
import {
  cleanStepName,
  escapeMermaidText,
  escapeStepName,
  getTriggerLabel,
  translateApiName,
  translateTypeName,
} from "./formatters";

describe("flow formatters", () => {
  it("translates known connector, action, and trigger names and keeps unknown names", () => {
    expect(translateApiName("shared_commondataserviceforapps")).toBe("Dataverse");
    expect(translateApiName("shared_example")).toBe("example");
    expect(translateApiName("customConnector")).toBe("customConnector");
    expect(translateTypeName("OpenApiConnection")).toBe("Standard connector action");
    expect(translateTypeName("CustomAction")).toBe("CustomAction");
    expect(getTriggerLabel("Manual")).toBe("Manueller Trigger");
    expect(getTriggerLabel("CustomTrigger")).toBe("CustomTrigger");
  });

  it("cleans diagram identifiers and escapes user-provided labels", () => {
    expect(cleanStepName("Get record / 1")).toBe("Get_record___1");
    expect(cleanStepName(undefined)).toBe("");
    expect(escapeStepName('Get [record]; "one"\nnow')).toBe("Get record one now");
    expect(escapeStepName(undefined)).toBe("");
    expect(escapeMermaidText('"@{value}?\nmore; text')).toBe("value more text");
    expect(escapeMermaidText(undefined)).toBe("");
    expect(escapeMermaidText("x".repeat(45))).toHaveLength(40);
  });
});
