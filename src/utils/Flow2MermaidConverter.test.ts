import { describe, expect, it, vi } from "vitest";
import { convertToMermaid } from "./Flow2MermaidConverter";

const flowJson = JSON.stringify({ properties: { definition: {
  triggers: { manual: { type: "Request" } },
  actions: {
    finish: { type: "Terminate", runAfter: { condition: ["Succeeded"] } },
    condition: { type: "If", expression: { equals: ["a", "b"] }, actions: { yes: { type: "Compose" } } },
  },
} } });

describe("convertToMermaid", () => {
  it("converts triggers and ordered conditional and terminal actions", () => {
    const result = convertToMermaid(flowJson);
    expect(result.diagram).toContain("Trigger: manual");
    expect(result.diagram).toContain("Condition - Start");
    expect(result.diagram).toContain("Compose: yes");
    expect(result.diagram).toContain("Terminate: finish");
    expect(result.legend.map(({ label }) => label)).toContain("Trigger");
  });

  it("renders switch, foreach, and standard action details", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        loop: { type: "Foreach", foreach: "items", actions: { inside: { type: "Compose" } } },
        choose: { type: "Switch", expression: "value", cases: { first: { case: "one", actions: { nested: { type: "Compose" } } } } },
        request: { type: "Http", inputs: { host: { apiId: "/providers/Microsoft.PowerApps/apis/shared_http" }, method: "GET", uri: "https://example.test" } },
      },
    } } }));
    expect(result.diagram).toContain("Foreach_Start_");
    expect(result.diagram).toContain("Switch - Start");
    expect(result.diagram).toContain("Host:");
    expect(result.diagram).toContain("Method: GET");
  });

  it("formats trigger parameters and Dataverse action details", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { when_record: {
        type: "OpenApiConnectionWebhook",
        inputs: {
          host: { apiId: "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps", connectionName: "shared_dv" },
          parameters: { "subscriptionRequest/entityname": "account", "subscriptionRequest/message": 2, "$hidden": "skip" },
        },
      } },
      actions: { update: {
        type: "OpenApiConnection",
        inputs: {
          host: { apiId: "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps" },
          method: "PATCH", uri: "/accounts", queries: { "$select": "ignored", filter: "name eq \"A\"" },
          body: { name: "Updated" },
          parameters: { "item/message": 1, "item/scope": 4, "item/runas": 2, "emailMessage/importance": 1, "item/custom": 99 },
        },
      } },
    } } }));
    expect(result.diagram).toContain("Connection: Dataverse");
    expect(result.diagram).toContain("entityname: account");
    expect(result.diagram).toContain("message: Modified");
    expect(result.diagram).toContain("Host: Dataverse");
    expect(result.diagram).toContain("Query filter: name eq A");
    expect(result.diagram).toContain("Body: name:Updated");
    expect(result.diagram).toContain("message: Created");
    expect(result.diagram).toContain("scope: Organization");
    expect(result.diagram).toContain("runas: CallingUser");
    expect(result.diagram).toContain("importance: High");
    expect(result.diagram).toContain("custom: 99");
    expect(result.diagram).not.toContain("hidden");
  });

  it("renders empty branches, empty switches, and empty foreach blocks", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        emptyLoop: { type: "Foreach", actions: {} },
        emptySwitch: { type: "Switch", expression: "choice", cases: {} },
        emptyCondition: { type: "If", expression: { equals: ["x", "y"] }, actions: {}, else: { actions: {} } },
        directCondition: { type: "If", expression: { equals: ["a", "b"] } },
        plainSwitch: { type: "Switch" },
        plainLoop: { type: "Foreach" },
      },
    } } }));

    expect(result.diagram).toContain("subgraph Foreach_Start_");
    expect(result.diagram).toContain("Switch - Start");
    expect(result.diagram).toContain("Condition - Start");
    expect(result.diagram).toContain("Condition_Start_");
    expect(result.diagram).toContain("-->|true|");
    expect(result.diagram).toContain("-->|false|");
    expect(result.diagram).toContain("plainSwitch[");
    expect(result.diagram).toContain("plainLoop[");
  });

  it("handles switch cases with and without actions inside a foreach", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        loop: { type: "Foreach", actions: {
          choose: { type: "Switch", expression: "@item()", cases: {
            empty: { case: "empty" },
            populated: { case: "populated", actions: { child: { type: "Compose" } } },
          } },
        } },
      },
    } } }));

    expect(result.diagram).toContain("Switch - Start");
    expect(result.diagram).toContain("|populated| child");
    expect(result.diagram).toContain("Switch_End_");
  });

  it("renders nested conditions with both branches and preserves connector labels", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        outer: { type: "If", expression: { equals: ["outer", "yes"] }, actions: {
          inner: { type: "If", expression: { equals: ["inner", "yes"] }, actions: { yes: { type: "Compose" } }, else: { actions: { no: { type: "Compose" } } } },
        }, else: { actions: { alternative: { type: "Compose" } } } },
      },
    } } }));
    expect(result.diagram).toContain("Condition - Start");
    expect(result.diagram).toContain("|true|");
    expect(result.diagram).toContain("|false|");
    expect(result.diagram).toContain("Compose: yes");
    expect(result.diagram).toContain("Compose: no");
    expect(result.diagram).toContain("Compose: alternative");
    expect(result.diagram).toContain("Condition - End");
  });

  it("handles switch cases with empty action maps and advances after terminating nested flows", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        choose: { type: "Switch", expression: "choice", cases: {
          empty: { case: "empty", actions: {} },
          stops: { case: "stops", actions: { stop: { type: "Terminate" } } },
        } },
        following: { type: "Compose", runAfter: { choose: ["Succeeded"] } },
      },
    } } }));
    expect(result.diagram).toContain("Switch - Start");
    expect(result.diagram).toContain("|stops| stop");
    expect(result.diagram).toContain("Switch_End_");
    expect(result.diagram).toContain("Compose: following");
  });

  it("renders nested standard actions and an empty action list", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { "manual trigger": { type: "Manual" } },
      actions: {
        scope: { type: "Scope", actions: {
          child: { type: "Compose", actions: { grandchild: { type: "Compose" } } },
        } },
      },
    } } }));
    expect(result.diagram).toContain("scope[\"Logical grouping container: scope\"]");
    expect(result.diagram).toContain("Compose: child");
    expect(result.diagram).toContain("Compose: grandchild");
    const emptyResult = convertToMermaid(JSON.stringify({
      properties: {
        definition: {
          triggers: { manual: { type: "Manual" } },
          actions: {},
        },
      },
    }));
    expect(emptyResult.diagram).toContain('manual["Trigger: manual');
  });

  it("starts nested foreach and condition branches without a predecessor node", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        loop: { type: "Foreach", actions: {
          nestedLoop: { type: "Foreach", foreach: "items", actions: { nestedAction: { type: "Compose" } } },
          condition: { type: "If", expression: { equals: ["left", "right"] } },
        } },
      },
    } } }));

    expect(result.diagram).toContain("Foreach_Start_");
    expect(result.diagram).toContain("Condition - Start");
    expect(result.diagram).toContain("nestedAction[");
    expect(result.diagram).toContain("-->|true|");
    expect(result.diagram).toContain("-->|false|");
  });

  it("continues after terminate and renders an unhandled action type", () => {
    const result = convertToMermaid(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        stop: { type: "Terminate" },
        afterStop: { type: "CustomAction", runAfter: { stop: ["Succeeded"] } },
      },
    } } }));

    expect(result.diagram).toContain("Terminate: stop");
    expect(result.diagram).toContain('afterStop["CustomAction: afterStop"]');
    expect(result.diagram).toContain("fill:#cce5ff");
  });

  it("returns a stable error result for invalid JSON or invalid dependency graphs", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(convertToMermaid("bad json")).toEqual({ diagram: "Error parsing JSON", legend: [] });
    expect(convertToMermaid(JSON.stringify({ properties: { definition: { triggers: {}, actions: {} } } })))
      .toEqual({ diagram: "Error parsing JSON", legend: [] });
    expect(log).toHaveBeenCalled();
  });
});
