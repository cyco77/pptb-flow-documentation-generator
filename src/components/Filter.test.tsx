import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Filter } from "./Filter";

const flows = [
  { workflowid: "2", name: "Zulu" },
  { workflowid: "1", name: "Alpha" },
] as never;

describe("Filter", () => {
  it("renders flow options alphabetically and reports selection", async () => {
    const onFilterChanged = vi.fn();
    render(<Filter flowDefinitions={flows} onFilterChanged={onFilterChanged} />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("option", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Alpha", "Zulu"]);
    fireEvent.click(screen.getByRole("option", { name: "Zulu" }));
    expect(onFilterChanged).toHaveBeenCalledWith("2");
  });
});
