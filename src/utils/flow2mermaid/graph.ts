import { ActionsMap, ExpressionMap } from "./types";

export function translateIfExpression(expression: ExpressionMap | undefined): string {
  if (!expression) return "";

  const processInner = (values: any): string => {
    return Object.entries(values)
      .map(([name, map]) =>
        Object.entries(map as [])
          .map(([innerName, innerValues]) => {
            try {
              return `${innerName} => ${(innerValues as []).join(",")}<br/>`;
            } catch (error) {
              console.error(`Error processing inner expression in :${name}`, error);
              return "";
            }
          })
          .join("")
      )
      .join("");
  };

  return Object.entries(expression)
    .map(([expressionName, values]) => {
      if (expressionName === "and" || expressionName === "or") {
        return `${expressionName} => <br/>(` + processInner(values) + `)`;
      }

      try {
        return `${expressionName} => ${(values as []).join(",")}<br/>`;
      } catch (error) {
        console.error("Error processing expression:", error);
        return "";
      }
    })
    .join("");
}

export function topologicalSort(actions: ActionsMap): string[] {
  const graph = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  for (const actionName of Object.keys(actions)) {
    graph.set(actionName, new Set());
    inDegree.set(actionName, 0);
  }

  for (const [actionName, action] of Object.entries(actions)) {
    if (action.runAfter) {
      for (const dep of Object.keys(action.runAfter)) {
        graph.get(dep)?.add(actionName);
        inDegree.set(actionName, (inDegree.get(actionName) || 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [actionName, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(actionName);
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of graph.get(current) || []) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 1) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (result.length !== Object.keys(actions).length) {
    throw new Error("Cycle detected in action dependencies!");
  }

  return result;
}
