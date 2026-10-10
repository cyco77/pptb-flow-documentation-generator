import { describe, expect, it, vi } from "vitest";
import type { ActionsMap, ExpressionMap } from "./types";
import { topologicalSort, translateIfExpression } from "./graph";

describe("flow graph helpers", () => {
  it("sorts actions according to run-after dependencies", () => {
    expect(topologicalSort({
      third: { type: "Compose", metadata: { operationMetadataId: "third" }, runAfter: { second: ["Succeeded"] } },
      first: { type: "Compose", metadata: { operationMetadataId: "first" } },
      second: { type: "Compose", metadata: { operationMetadataId: "second" }, runAfter: { first: ["Succeeded"] } },
    } satisfies ActionsMap)).toEqual(["first", "second", "third"]);
  });

  it("returns independent actions and rejects cyclic dependencies", () => {
    expect(topologicalSort({ one: { type: "Compose", metadata: { operationMetadataId: "one" } }, two: { type: "Compose", metadata: { operationMetadataId: "two" } } })).toEqual(["one", "two"]);
    expect(() => topologicalSort({
      one: { type: "Compose", metadata: { operationMetadataId: "one" }, runAfter: { two: ["Succeeded"] } },
      two: { type: "Compose", metadata: { operationMetadataId: "two" }, runAfter: { one: ["Succeeded"] } },
    } satisfies ActionsMap)).toThrow("Cycle detected in action dependencies!");
  });

  it("formats simple and compound expressions, tolerating malformed values", () => {
    expect(translateIfExpression(undefined)).toBe("");
    expect(translateIfExpression({ equals: ["a", "b"] } as unknown as ExpressionMap)).toBe("equals => a,b<br/>");
    expect(translateIfExpression({ and: [{ equals: ["a", "b"] }] } as unknown as ExpressionMap)).toContain("and => <br/>(equals => a,b<br/>)");
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(translateIfExpression({ equals: 1 } as unknown as ExpressionMap)).toBe("");
    expect(error).toHaveBeenCalled();
  });
});
