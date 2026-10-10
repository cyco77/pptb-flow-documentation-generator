import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const mocks = vi.hoisted(() => ({
  connection: { id: "connection-1" },
  refreshConnection: vi.fn(),
  overviewProps: vi.fn(),
  toolboxEventCallback: undefined as ((event: string, data: unknown) => void) | undefined,
  getCurrentTheme: vi.fn(),
}));

vi.mock("./hooks/useConnection", () => ({
  useConnection: () => ({ connection: mocks.connection, isLoading: false, refreshConnection: mocks.refreshConnection }),
}));
vi.mock("./hooks/useToolboxEvents", () => ({
  useToolboxEvents: (callback: (event: string, data: unknown) => void) => { mocks.toolboxEventCallback = callback; },
}));
vi.mock("./components/Overview", () => ({
  Overview: (props: unknown) => { mocks.overviewProps(props); return <div>Overview</div>; },
}));

describe("App", () => {
  beforeEach(() => {
    mocks.refreshConnection.mockReset();
    mocks.overviewProps.mockClear();
    mocks.getCurrentTheme.mockReset().mockResolvedValue("dark");
    Object.assign(window, { toolboxAPI: { utils: { getCurrentTheme: mocks.getCurrentTheme } } });
  });

  it("loads the host theme and passes connection and theme to the overview", async () => {
    render(<App />);
    expect(screen.getByText("Flow Documentation Generator")).toBeInTheDocument();
    await waitFor(() => expect(mocks.overviewProps).toHaveBeenLastCalledWith({
      connection: mocks.connection, isConnectionLoading: false, isDarkMode: true,
    }));
    expect(mocks.getCurrentTheme).toHaveBeenCalledOnce();
  });

  it("refreshes connections for connection events and ignores terminal events", () => {
    render(<App />);
    act(() => {
      mocks.toolboxEventCallback?.("connection:updated", {});
      mocks.toolboxEventCallback?.("connection:created", {});
      mocks.toolboxEventCallback?.("connection:deleted", {});
      mocks.toolboxEventCallback?.("terminal:output", {});
    });
    expect(mocks.refreshConnection).toHaveBeenCalledTimes(3);
  });

  it("updates the theme when host settings change", async () => {
    render(<App />);
    mocks.getCurrentTheme.mockResolvedValue("light");
    mocks.toolboxEventCallback?.("settings:updated", {});
    await waitFor(() => expect(mocks.overviewProps).toHaveBeenLastCalledWith({
      connection: mocks.connection, isConnectionLoading: false, isDarkMode: false,
    }));
  });
});
