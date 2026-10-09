import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useToolboxEvents } from "./useToolboxEvents";

describe("useToolboxEvents", () => {
  it("subscribes to toolbox events and forwards event names and payload data", () => {
    const on = vi.fn();
    Object.assign(window, { toolboxAPI: { events: { on } } });
    const callback = vi.fn();
    renderHook(() => useToolboxEvents(callback));
    const handler = on.mock.calls[0][0];
    handler({}, { event: "connection:updated", data: { id: "1" } });
    expect(callback).toHaveBeenCalledWith("connection:updated", { id: "1" });
  });
});
