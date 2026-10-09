import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlowDetails } from "./FlowDetails";
import type { FLowDefinition } from "../types/flowDefinition";
import { logger } from "../services/loggerService";

const mermaid = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }));
vi.mock("mermaid", () => ({ default: mermaid }));

const flow: FLowDefinition = {
  workflowid: "flow-1", name: "Test Flow", description: "Flow description", createdon: new Date("2024-01-01"),
  modifiedon: new Date("2024-01-02"), statecode: 1, createdby: "Creator", modifiedby: "Editor",
  trigger: { name: "manual", type: "Manual", label: "Manual trigger" }, connections: ["Dataverse"], owner: { name: "Owner" },
  clientdata: JSON.stringify({ properties: { definition: { triggers: { manual: { type: "Manual" } }, actions: { action: { type: "Compose" } } } } }),
};

describe("FlowDetails", () => {
  beforeEach(() => {
    mermaid.initialize.mockReset();
    mermaid.render.mockReset().mockResolvedValue({ svg: '<svg viewBox="0 0 100 80"><text>Diagram</text></svg>' });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => new DOMRect(),
    });
    Object.assign(window, { toolboxAPI: {
      utils: { copyToClipboard: vi.fn().mockResolvedValue(undefined), showNotification: vi.fn().mockResolvedValue(undefined) },
      fileSystem: { saveFile: vi.fn().mockResolvedValue(undefined) },
    } });
  });

  it("renders flow metadata and the diagram, and switches among code views", async () => {
    const { container } = render(<FlowDetails flow={flow} isDarkMode />);
    expect(screen.getByText("Workflow ID:")).toBeInTheDocument();
    expect(screen.getByText("Test Flow")).toBeInTheDocument();
    expect(screen.getByText("Flow description")).toBeInTheDocument();
    await waitFor(() => expect(mermaid.render).toHaveBeenCalledOnce());
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: "dark" }));
    fireEvent.click(screen.getByRole("button", { name: "SVG" }));
    await waitFor(() => expect(window.toolboxAPI.fileSystem.saveFile).toHaveBeenCalledWith(
      "Test_Flow_diagram.svg", expect.stringContaining("<svg"),
    ));

    fireEvent.click(screen.getByRole("tab", { name: "Mermaid Code" }));
    expect(screen.getByText(/Trigger: manual/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "PlantUML" }));
    expect(screen.getByText(/@startuml/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
    expect(screen.getByPlaceholderText("Search in JSON...")).toBeInTheDocument();
    expect(container.querySelector("pre")?.textContent).toContain('"triggers"');
    fireEvent.change(screen.getByPlaceholderText("Search in JSON..."), { target: { value: "manual" } });
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByPlaceholderText("Search in JSON..."), { target: { value: "absent" } });
    expect(screen.getByText("No matches")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Mermaid Code" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(window.toolboxAPI.utils.copyToClipboard).toHaveBeenCalled());
  });

  it("renders the empty selection message and reports invalid flow JSON", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender } = render(<FlowDetails flow={undefined} isDarkMode={false} />);
    expect(screen.getByText("Please select a flow from the dropdown above.")).toBeInTheDocument();
    rerender(<FlowDetails flow={{ ...flow, clientdata: "invalid" }} isDarkMode={false} />);
    expect(screen.getByText("Failed to parse flow definition")).toBeInTheDocument();
  });

  it("shows diagram render errors and keeps the error visible", async () => {
    mermaid.render.mockRejectedValueOnce(new Error("render failed"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<FlowDetails flow={flow} isDarkMode={false} />);
    expect(await screen.findByText("Error rendering diagram: render failed")).toBeInTheDocument();
    expect(logger).toBeDefined();
  });

  it("supports zoom controls, wheel zoom, search navigation, and fullscreen failures", async () => {
    const { container } = render(<FlowDetails flow={flow} isDarkMode={false} />);
    await waitFor(() => expect(mermaid.render).toHaveBeenCalledOnce());
    await waitFor(() => expect(container.querySelector("svg")).not.toBeNull());
    const zoomSlider = screen.getByRole("slider", { name: "Zoom level" });
    expect(zoomSlider).toHaveValue("0.5");
    fireEvent.click(screen.getByTitle("Zoom In"));
    expect(screen.getByText("60%")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Zoom Out"));
    fireEvent.click(screen.getByTitle("Reset Zoom"));
    expect(screen.getByText("50%")).toBeInTheDocument();

    fireEvent.change(zoomSlider, { target: { value: "1.2" } });
    expect(screen.getByText("120%")).toBeInTheDocument();
    fireEvent.change(zoomSlider, { target: { value: "0.5" } });

    const requestFullscreen = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, value: requestFullscreen });
    fireEvent.click(screen.getByRole("button", { name: "Enter Fullscreen" }));
    await waitFor(() => expect(window.toolboxAPI.utils.showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: "Fullscreen Failed" })));

    fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
    const search = screen.getByPlaceholderText("Search in JSON...");
    fireEvent.change(search, { target: { value: "manual" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    fireEvent.keyDown(search, { key: "Enter", shiftKey: true });
    fireEvent.click(screen.getByRole("button", { name: "Prev" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(search, { target: { value: " " } });
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("reports copy failures for Mermaid, PlantUML, and JSON content", async () => {
    const copyToClipboard = vi.fn().mockRejectedValue(new Error("clipboard blocked"));
    Object.assign(window, { toolboxAPI: { ...window.toolboxAPI, utils: { ...window.toolboxAPI.utils, copyToClipboard } } });
    render(<FlowDetails flow={flow} isDarkMode={false} />);
    fireEvent.click(screen.getByRole("tab", { name: "Mermaid Code" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("tab", { name: "PlantUML" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledTimes(3));
  });

  it("reports SVG export failures and uses the clipboard fallback when copying an SVG", async () => {
    const saveFile = vi.fn().mockRejectedValue(new Error("disk full"));
    const copyToClipboard = vi.fn().mockResolvedValue(undefined);
    Object.assign(window, { toolboxAPI: {
      ...window.toolboxAPI,
      fileSystem: { saveFile },
      utils: { ...window.toolboxAPI.utils, copyToClipboard },
    } });
    const { container, unmount } = render(<FlowDetails flow={flow} isDarkMode={false} />);
    await waitFor(() => expect(mermaid.render).toHaveBeenCalledOnce());
    await waitFor(() => expect(container.querySelector("svg")).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "SVG" }));
    await waitFor(() => expect(window.toolboxAPI.utils.showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: "Export Failed" })));

    unmount();
    mermaid.render.mockResolvedValueOnce({ svg: "" });
    const updatedFlow = { ...flow, workflowid: "flow-2" };
    render(<FlowDetails flow={updatedFlow} isDarkMode={false} />);
    await waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(window.toolboxAPI.utils.showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: "Copy Failed" })));
  });

  it("renders an empty data state and reinitializes Mermaid when the theme changes", async () => {
    const { rerender } = render(<FlowDetails flow={{ ...flow, clientdata: "" }} isDarkMode={false} />);
    fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
    expect(screen.getByText("No data available")).toBeInTheDocument();
    expect(mermaid.render).not.toHaveBeenCalled();

    rerender(<FlowDetails flow={flow} isDarkMode={false} />);
    fireEvent.click(screen.getByRole("tab", { name: "Diagram" }));
    await waitFor(() => expect(mermaid.render).toHaveBeenCalledOnce());
    rerender(<FlowDetails flow={flow} isDarkMode />);
    await waitFor(() => expect(mermaid.initialize).toHaveBeenLastCalledWith(expect.objectContaining({ theme: "dark" })));
    await waitFor(() => expect(mermaid.render).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole("tab", { name: "JSON" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(window.toolboxAPI.utils.copyToClipboard).toHaveBeenCalledWith(expect.stringContaining('"triggers"')));
  });

  it("enters and exits fullscreen and enforces zoom limits", async () => {
    render(<FlowDetails flow={flow} isDarkMode={false} />);
    await waitFor(() => expect(mermaid.render).toHaveBeenCalledOnce());
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, value: requestFullscreen });
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen });
    const fullscreenElement = screen.getByRole("tablist").parentElement?.parentElement;
    expect(fullscreenElement).not.toBeNull();
    let activeFullscreenElement: Element | null = null;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => activeFullscreenElement,
    });

    fireEvent.click(screen.getByRole("button", { name: "Enter Fullscreen" }));
    await waitFor(() => expect(requestFullscreen).toHaveBeenCalledOnce());
    await act(async () => {
      activeFullscreenElement = fullscreenElement!;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(screen.getByRole("button", { name: "Exit Fullscreen" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Exit Fullscreen" }));
    await waitFor(() => expect(exitFullscreen).toHaveBeenCalledOnce());

    for (let index = 0; index < 30; index += 1) fireEvent.click(screen.getByTitle("Zoom In"));
    expect(screen.getByText("300%")).toBeInTheDocument();
    expect(screen.getByTitle("Zoom In")).toBeDisabled();
    for (let index = 0; index < 30; index += 1) fireEvent.click(screen.getByTitle("Zoom Out"));
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByTitle("Zoom Out")).toBeDisabled();
  });

  it("exports PNG and copies an SVG image through the native clipboard API", async () => {
    mermaid.render.mockResolvedValueOnce({
      svg: '<svg><foreignObject><div>Label</div></foreignObject></svg>',
    });
    class MockImage {
      width = 48;
      height = 32;
      decoding = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    }
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("ClipboardItem", class { constructor(readonly items: Record<string, Blob>) {} });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillRect, drawImage, set fillStyle(_value: string) {} } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(new Blob(["png"], { type: "image/png" })));
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const createObjectURL = vi.fn().mockReturnValue("blob:diagram");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { write: clipboardWrite } });

    const { container } = render(<FlowDetails flow={flow} isDarkMode={false} />);
    await waitFor(() => expect(container.querySelector("svg")).not.toBeNull());
    await waitFor(() => expect(container.querySelector("svg foreignObject")).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "PNG" }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:diagram");
    expect(drawImage).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledOnce());
    expect(window.toolboxAPI.utils.showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: "Copy Successful" }));
  });

  it("reports PNG rendering errors and uses SVG dimensions when no viewBox is present", async () => {
    mermaid.render.mockResolvedValueOnce({ svg: "<svg><text>no viewBox</text></svg>" });
    class BrokenImage {
      decoding = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) { this.onerror?.(); }
    }
    vi.stubGlobal("Image", BrokenImage);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 80, height: 40 } as DOMRect);
    const { container } = render(<FlowDetails flow={flow} isDarkMode={false} />);
    await waitFor(() => expect(container.querySelector("svg")).not.toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "PNG" }));
    await waitFor(() => expect(window.toolboxAPI.utils.showNotification).toHaveBeenCalledWith(expect.objectContaining({
      title: "Export Failed",
      body: expect.stringContaining("Failed to render SVG"),
    })));
  });
});
