import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToolToolBar } from "./ToolBar";

describe("ToolToolBar", () => {
  it("renders font controls and its menu", async () => {
    render(<ToolToolBar />);
    expect(screen.getByRole("toolbar", { name: "Default" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase Font Size" })).toBeInTheDocument();
    screen.getByRole("button", { name: "More" }).click();
    expect(await screen.findByText("Open Folder")).toBeInTheDocument();
  });
});
