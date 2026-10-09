import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Overview } from "./Overview";
import type { FLowDefinition } from "../types/flowDefinition";

const services = vi.hoisted(() => ({
  loadFlowDefinitions: vi.fn(),
  loadFlowDefinitionsForSolutions: vi.fn(),
  loadSolutionPublisherCatalog: vi.fn(),
}));
vi.mock("../services/dataverseService", () => services);
vi.mock("./FlowDetails", () => ({ FlowDetails: ({ flow }: { flow?: FLowDefinition }) => <div>{flow?.name}</div> }));

const flows: FLowDefinition[] = [
  {
    workflowid: "b", name: "Beta", description: "Second flow", createdon: new Date("2024-02-01"), modifiedon: new Date("2024-02-02"),
    statecode: 1, trigger: { name: "manual", type: "Manual", label: "Manual trigger" }, connections: ["Dataverse"], owner: { name: "Owner" },
    clientdata: JSON.stringify({ properties: { definition: { triggers: { manual: { type: "Manual" } }, actions: {} } } }),
  },
  {
    workflowid: "a", name: "Alpha", description: "First flow", createdon: new Date("2024-01-01"), modifiedon: new Date("2024-01-02"),
    statecode: 0, connections: [],
  },
];
const connection = { id: "connection-1" } as ToolBoxAPI.DataverseConnection;

describe("Overview", () => {
  beforeEach(() => {
    services.loadFlowDefinitions.mockReset().mockResolvedValue(flows);
    services.loadFlowDefinitionsForSolutions.mockReset().mockResolvedValue(flows);
    services.loadSolutionPublisherCatalog.mockReset().mockResolvedValue({
      solutions: [{ id: "solution-1", name: "Core", publisherName: "Maker" }], publishers: ["Maker"],
    });
    Object.assign(window, { toolboxAPI: {
      utils: {
        showNotification: vi.fn().mockResolvedValue(undefined),
        copyToClipboard: vi.fn().mockResolvedValue(undefined),
      },
      fileSystem: { saveFile: vi.fn().mockResolvedValue(undefined) },
    } });
  });

  it("keeps the initial loading indicator while the connection is being resolved", () => {
    render(<Overview connection={null} isConnectionLoading isDarkMode={false} />);
    expect(screen.getByText("Loading flows...")).toBeInTheDocument();
    expect(services.loadFlowDefinitions).not.toHaveBeenCalled();
  });

  it("loads flow data after connection resolution and hides loading when no connection exists", async () => {
    const { rerender } = render(<Overview connection={null} isConnectionLoading isDarkMode={false} />);
    rerender(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    expect(await screen.findByText("Beta")).toBeInTheDocument();
    expect(services.loadSolutionPublisherCatalog).toHaveBeenCalledOnce();
    expect(services.loadFlowDefinitions).toHaveBeenCalledOnce();

    rerender(<Overview connection={null} isConnectionLoading={false} isDarkMode={false} />);
    await waitFor(() => expect(screen.queryByText("Loading flows...")).not.toBeInTheDocument());
  });

  it("filters by search, sorts rows, and opens the selected flow drawer", async () => {
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    const beta = await screen.findByText("Beta");
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search by name or description..."), { target: { value: "Dataverse" } });
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search by name or description..."), { target: { value: "" } });

    const betaRow = beta.closest("tr");
    expect(betaRow).not.toBeNull();
    expect(within(betaRow!).getByText("Manual trigger")).toBeInTheDocument();
    expect(within(betaRow!).getByText("Dataverse")).toBeInTheDocument();
    expect(within(betaRow!).getByText("Owner")).toBeInTheDocument();
    fireEvent.click(beta);
    expect(await screen.findByRole("complementary", { name: "Beta" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("complementary", { name: "Beta" })).not.toBeInTheDocument());
  });

  it("shows an error-safe empty result if initial flow loading fails", async () => {
    services.loadSolutionPublisherCatalog.mockRejectedValueOnce(new Error("offline"));
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    await waitFor(() => expect(screen.queryByText("Loading flows...")).not.toBeInTheDocument());
    expect(services.loadFlowDefinitions).not.toHaveBeenCalled();
  });

  it("sorts by date and toggles the sort direction", async () => {
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    await screen.findByText("Beta");
    const rows = () => screen.getAllByRole("row").slice(1).map((row) => row.textContent);
    fireEvent.click(screen.getByText(/Created On/));
    expect(rows()[0]).toContain("Alpha");
    fireEvent.click(screen.getByText(/Created On/));
    expect(rows()[0]).toContain("Beta");
  });

  it("selects flows and exports them using the action menu", async () => {
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    await screen.findByText("Beta");
    const betaRow = screen.getByText("Beta").closest("tr")!;
    fireEvent.click(within(betaRow).getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Actions for 1 selected flows" }));
    fireEvent.click(await screen.findByText("Export CSV"));
    await waitFor(() => expect(window.toolboxAPI.fileSystem.saveFile).toHaveBeenCalled());
  });

  it("loads the selected solution and handles an empty matching solution set", async () => {
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    await screen.findByText("Beta");
    fireEvent.click(screen.getAllByRole("combobox")[1]);
    fireEvent.click(await screen.findByText("Core"));
    await waitFor(() => expect(services.loadFlowDefinitionsForSolutions).toHaveBeenCalledWith(["solution-1"], [
      { id: "solution-1", name: "Core", publisherName: "Maker" },
    ]));
  });

  it("filters by publisher, then reloads flows for that publisher", async () => {
    services.loadFlowDefinitionsForSolutions.mockResolvedValueOnce([flows[0]]);
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode />);
    await screen.findByText("Beta");
    fireEvent.click(screen.getAllByRole("combobox")[0]);
    fireEvent.click(await screen.findByText("Maker"));
    await waitFor(() => expect(services.loadFlowDefinitionsForSolutions).toHaveBeenCalledWith(["solution-1"], [
      { id: "solution-1", name: "Core", publisherName: "Maker" },
    ]));
    await waitFor(() => expect(screen.queryByText("Alpha")).not.toBeInTheDocument());
  });

  it("supports selecting rows, header selection, and the Markdown export dialog", async () => {
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    await screen.findByText("Beta");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all visible flows" }));
    expect(screen.getByRole("button", { name: "Actions for 2 selected flows" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actions for 2 selected flows" }));
    fireEvent.click(await screen.findByText("Export Markdown"));
    expect(screen.getByRole("dialog", { name: "Export Markdown" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "PlantUML" }));
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Export Markdown" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Actions for 2 selected flows" }));
    fireEvent.click(await screen.findByText("Copy Markdown"));
    await waitFor(() => expect(window.toolboxAPI.utils.showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: "Copy Successful" })));
  });

  it("clears selection from a row checkbox and closes the drawer from its backdrop", async () => {
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    await screen.findByText("Beta");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Beta" }));
    expect(screen.getByRole("button", { name: "Actions for 1 selected flows" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actions for 1 selected flows" }));
    fireEvent.click(await screen.findByText("Copy CSV"));
    await waitFor(() => expect(window.toolboxAPI.utils.showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: "Copy Successful" })));

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByText("Beta"));
    expect(await screen.findByRole("complementary", { name: "Beta" })).toBeInTheDocument();
    const drawer = screen.getByRole("complementary", { name: "Beta" });
    const backdrop = drawer.previousElementSibling;
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    await waitFor(() => expect(screen.queryByRole("complementary", { name: "Beta" })).not.toBeInTheDocument());
  });

  it("keeps the table usable when a filtered flow request fails", async () => {
    services.loadFlowDefinitionsForSolutions.mockRejectedValueOnce(new Error("offline"));
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    await screen.findByText("Beta");
    fireEvent.click(screen.getAllByRole("combobox")[1]);
    fireEvent.click(await screen.findByText("Core"));
    await waitFor(() => expect(screen.queryByText("Loading flows...")).not.toBeInTheDocument());
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders all three filter controls as full-width controls on narrow layouts", async () => {
    render(<Overview connection={connection} isConnectionLoading={false} isDarkMode={false} />);
    await screen.findByText("Beta");
    const dropdowns = screen.getAllByRole("combobox");
    const search = screen.getByPlaceholderText("Search by name or description...");
    const filterRow = screen.getByTestId("overview-filter-controls");
    const overviewRoot = filterRow.parentElement;

    expect(getComputedStyle(filterRow).display).toBe("flex");
    expect(getComputedStyle(overviewRoot!).containerType).toBe("inline-size");
    expect(getComputedStyle(overviewRoot!).containerName).toBe("overview");
    expect(dropdowns).toHaveLength(2);
    expect(filterRow.contains(dropdowns[0])).toBe(true);
    expect(filterRow.contains(dropdowns[1])).toBe(true);
    expect(filterRow.contains(search)).toBe(true);
  });
});
