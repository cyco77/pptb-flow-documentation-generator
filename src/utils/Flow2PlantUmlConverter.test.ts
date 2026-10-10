import { describe, expect, it, vi } from "vitest";
import { convertToPlantUml } from "./Flow2PlantUmlConverter";

describe("convertToPlantUml", () => {
  it("converts action, condition branches, switch cases, foreach, and terminate", () => {
    const json = JSON.stringify({ properties: { definition: {
      triggers: { "manual\ntrigger": { type: "Manual" } },
      actions: {
        condition: { type: "If", expression: { equals: ["left", "right"] }, actions: { yes: { type: "Compose" } }, else: { actions: { no: { type: "Terminate" } } } },
        choose: { type: "Switch", expression: "choice", cases: { first: { case: "one", actions: { branch: { type: "Compose" } } } } },
        loop: { type: "Foreach", foreach: "items", actions: { inside: { type: "Compose" } } },
      },
    } } });
    const diagram = convertToPlantUml(json).diagram;
    expect(diagram).toContain("@startuml");
    expect(diagram).toContain("Trigger: manual trigger");
    expect(diagram).toContain("if (equals => left,right?) then (true)");
    expect(diagram).toContain("case == one");
    expect(diagram).toContain("while (Foreach: loop from items)");
    expect(diagram).toContain("stop");
    expect(diagram).toContain("@enduml");
  });

  it("reports malformed input without throwing", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(convertToPlantUml("invalid")).toEqual({ diagram: "Error parsing JSON" });
  });

  it("includes trigger metadata and safely formats Dataverse action parameters", () => {
    const diagram = convertToPlantUml(JSON.stringify({ properties: { definition: {
      triggers: { "manual {trigger}": { type: "Manual", inputs: {
        host: { apiId: "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps", connectionName: "dv" },
        parameters: { "subscriptionRequest/entityname": "account", "subscriptionRequest/message": 2 },
      } } },
      actions: { action: { type: "OpenApiConnection", inputs: {
        host: { apiId: "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps" },
        parameters: { "item/message": 1, "item/scope": 4, "item/runas": 2, "item/importance": 1 },
      } } },
    } } })).diagram;
    expect(diagram).toContain("Connection: Dataverse");
    expect(diagram).toContain("entityname: account");
    expect(diagram).toContain("message: Modified");
    expect(diagram).toContain("message: Created");
    expect(diagram).toContain("scope: Organization");
    expect(diagram).toContain("runas: CallingUser");
    expect(diagram).toContain("importance: High");
  });

  it("renders empty conditional branches, switches, and loops with sensible fallbacks", () => {
    const diagram = convertToPlantUml(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        condition: { type: "If", actions: {}, else: { actions: {} } },
        emptySwitch: { type: "Switch", cases: {} },
        switchCases: { type: "Switch", cases: {
          "": { case: "", actions: {} },
          second: {},
        } },
        emptyLoop: { type: "Foreach", actions: {} },
      },
    } } })).diagram;

    expect(diagram).toContain("if (condition?) then (true)");
    expect(diagram).toContain(":No true-branch actions;");
    expect(diagram).toContain(":No false-branch actions;");
    expect(diagram).toContain(":Switch: condition;");
    expect(diagram).toContain(":No cases defined;");
    expect(diagram).toContain("case == case-1");
    expect(diagram).toContain(":No actions for case-1;");
    expect(diagram).toContain(":No actions for second;");
    expect(diagram).toContain("while (Foreach: emptyLoop from items)");
    expect(diagram).toContain(":No loop actions;");
  });

  it("formats nested action branches and terminates after nested action processing", () => {
    const diagram = convertToPlantUml(JSON.stringify({ properties: { definition: {
      triggers: { " trigger\nwith \"quotes\" {value} ": { type: "Manual" } },
      actions: {
        container: { type: "Scope", actions: {
          loop: { type: "Foreach", foreach: " @{variables('items')} ", actions: {
            nested: { type: "If", expression: { equals: ["a", "b"] }, actions: { done: { type: "Terminate" } } },
          } },
        } },
      },
    } } })).diagram;

    expect(diagram).toContain("Trigger: trigger with 'quotes' value");
    expect(diagram).toContain("while (Foreach: loop from @variables('items'))");
    expect(diagram).toContain(":Logical grouping container: container");
    expect(diagram).not.toContain("Compose");
    expect(diagram.match(/\bstop\b/g)).toHaveLength(2);
  });

  it("returns an error result when the dependency graph contains a cycle", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const diagram = convertToPlantUml(JSON.stringify({ properties: { definition: {
      triggers: { manual: { type: "Manual" } },
      actions: {
        first: { type: "Compose", runAfter: { second: ["Succeeded"] } },
        second: { type: "Compose", runAfter: { first: ["Succeeded"] } },
      },
    } } }));
    expect(diagram).toEqual({ diagram: "Error parsing JSON" });
  });
});
