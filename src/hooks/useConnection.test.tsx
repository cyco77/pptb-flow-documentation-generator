import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConnection } from "./useConnection";

describe("useConnection", () => {
  const getActiveConnection = vi.fn();

  beforeEach(() => {
    getActiveConnection.mockReset();
    Object.assign(window, { toolboxAPI: { connections: { getActiveConnection } } });
  });

  it("loads the active connection on mount and exposes the completed state", async () => {
    const connection = { id: "connection-1" } as ToolBoxAPI.DataverseConnection;
    getActiveConnection.mockResolvedValue(connection);
    const { result } = renderHook(() => useConnection());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current).toMatchObject({ connection, isLoading: false }));
  });

  it("clears loading after errors and refreshes on demand", async () => {
    getActiveConnection.mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => useConnection());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    getActiveConnection.mockResolvedValueOnce(null);
    await act(() => result.current.refreshConnection());
    expect(result.current.connection).toBeNull();
    expect(getActiveConnection).toHaveBeenCalledTimes(2);
  });
});
