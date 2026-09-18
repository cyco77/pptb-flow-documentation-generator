import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  loadFlowDefinitions,
  loadFlowDefinitionsForSolutions,
  loadSolutionPublisherCatalog,
  SolutionFilterOption,
} from "../services/dataverseService";
import { FlowDetails } from "./FlowDetails";
import {
  makeStyles,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Link,
  Text,
  Badge,
  Input,
  Button,
  Checkbox,
  Dropdown,
  Option,
  tokens,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  Search20Regular,
  ArrowDownload24Regular,
  Copy24Regular,
  DocumentTable24Regular,
  ArrowUp16Regular,
  ArrowDown16Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { logger } from "../services/loggerService";
import { FLowDefinition } from "../types/flowDefinition";
import {
  exportFlowDefinitionsToCSV,
  copyFlowDefinitionsAsCSV,
  copyFlowDefinitionsAsMarkdown,
  exportFlowDefinitionsToMarkdown,
  DiagramFormat,
} from "../utils/exportUtils";

interface IOverviewProps {
  connection: ToolBoxAPI.DataverseConnection | null;
  isDarkMode: boolean;
}

export const Overview: React.FC<IOverviewProps> = ({
  connection,
  isDarkMode,
}) => {
  const [flowDefinitions, setFlowDefinitions] = useState<FLowDefinition[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<FLowDefinition | undefined>(
    undefined
  );
  const [isLoadingFlowDefinitions, setIsLoadingFlowDefinitons] =
    useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [filterText, setFilterText] = useState<string>("");
  const [sortState, setSortState] = useState<{
    sortColumn: keyof FLowDefinition | undefined;
    sortDirection: "ascending" | "descending";
  }>({ sortColumn: "name", sortDirection: "ascending" });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>([]);
  const [solutionFilter, setSolutionFilter] = useState<string[]>([]);
  const [publisherFilter, setPublisherFilter] = useState<string[]>([]);
  const [diagramFormat, setDiagramFormat] = useState<DiagramFormat>("mermaid");
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [solutionCatalog, setSolutionCatalog] = useState<SolutionFilterOption[]>([]);
  const [publisherOptions, setPublisherOptions] = useState<string[]>([]);

  const useStyles = makeStyles({
    root: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minHeight: 0,
      overflow: "visible",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
    },
    tableContainer: {
      overflowX: "auto",
      position: "relative",
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
    },
    tableLoadingOverlay: {
      position: "absolute",
      inset: 0,
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: tokens.colorNeutralBackgroundAlpha,
    },
    table: {
      width: "2128px",
      minWidth: "2128px",
      maxWidth: "2128px",
      tableLayout: "fixed",
    },
    tableRow: {
      height: "44px",
      "& > td": {
        verticalAlign: "middle",
      },
    },
    compactCell: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      minWidth: 0,
      "& span": {
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },
    clickableRow: {
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
      },
    },
    selectedRow: {
      backgroundColor: tokens.colorNeutralBackground1Selected,
      "&:hover": {
        backgroundColor: tokens.colorNeutralBackground1Selected,
      },
    },
    sortableHeader: {
      cursor: "pointer",
      userSelect: "none",
      "&:hover": {
        backgroundColor: tokens.colorNeutralBackground1Hover,
      },
    },
    tableHeader: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      backgroundColor: tokens.colorNeutralBackground1,
    },
    resizer: {
      cursor: "col-resize",
      position: "absolute",
      right: "0",
      top: "0",
      bottom: "0",
      width: "4px",
      "&:hover": {
        backgroundColor: tokens.colorBrandBackground,
      },
    },
    filterContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: tokens.spacingHorizontalM,
      marginBottom: tokens.spacingVerticalM,
      position: "relative",
      zIndex: 10,
    },
    dropdownListbox: {
      zIndex: 1000,
    },
    searchInput: {
      minWidth: "300px",
      flexGrow: 1,
    },
    buttonGroup: {
      display: "flex",
      gap: tokens.spacingHorizontalS,
      position: "relative",
    },
    selectionCell: {
      width: "48px",
      minWidth: "48px",
      maxWidth: "48px",
      paddingLeft: tokens.spacingHorizontalS,
      paddingRight: tokens.spacingHorizontalS,
      textAlign: "center",
    },
    drawer: {
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      width: "80vw",
      maxWidth: "1400px",
      backgroundColor: tokens.colorNeutralBackground1,
      boxShadow: tokens.shadow64,
      borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
      overflow: "hidden",
    },
    drawerBackdrop: {
      position: "fixed",
      inset: 0,
      zIndex: 999,
      backgroundColor: "transparent",
    },
    dialogBackdrop: {
      position: "fixed",
      inset: 0,
      zIndex: 1099,
      backgroundColor: "transparent",
    },
    dialogSurface: {
      position: "fixed",
      top: "50%",
      left: "50%",
      zIndex: 1100,
      width: "min(600px, calc(100vw - 32px))",
      transform: "translate(-50%, -50%)",
      padding: tokens.spacingHorizontalXXL,
      borderRadius: tokens.borderRadiusXLarge,
      border: `1px solid ${tokens.colorTransparentStroke}`,
      backgroundColor: tokens.colorNeutralBackground1,
      color: tokens.colorNeutralForeground1,
      boxShadow: tokens.shadow64,
    },
  });

  const styles = useStyles();

  const showNotification = useCallback(
    async (
      title: string,
      body: string,
      type: "success" | "info" | "warning" | "error"
    ) => {
      try {
        await window.toolboxAPI.utils.showNotification({
          title,
          body,
          type,
          duration: 3000,
        });
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    },
    []
  );

  useEffect(() => {
    if (!connection) {
      setIsLoadingFlowDefinitons(false);
      setIsInitialLoading(false);
      return;
    }
    loadSolutionPublisherCatalog()
      .then(async (catalog) => {
        setSolutionCatalog(catalog.solutions);
        setPublisherOptions(catalog.publishers);
        setIsLoadingFlowDefinitons(true);
        try {
          const flows = await loadFlowDefinitions();
          setFlowDefinitions(flows);
          logger.info(`Fetched ${flows.length} flow-definitions`);
        } finally {
          setIsLoadingFlowDefinitons(false);
          setIsInitialLoading(false);
        }
      })
      .catch((error) => {
        logger.error(`Error loading solution filters: ${(error as Error).message}`);
        setIsLoadingFlowDefinitons(false);
        setIsInitialLoading(false);
      });
  }, [connection]);

  const getStateLabel = (statecode: number) => {
    switch (statecode) {
      case 0:
        return { text: "Draft", color: "informative" as const };
      case 1:
        return { text: "Active", color: "success" as const };
      default:
        return { text: "Inactive", color: "subtle" as const };
    }
  };

  const handleRowClick = (flow: FLowDefinition) => {
    logger.info(`Selected flow: ${flow.name}`);
    setSelectedFlow(flow);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    if (!isDrawerOpen && !isExportDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isExportDialogOpen) {
        setIsExportDialogOpen(false);
      } else {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, isExportDialogOpen]);

  // Filter flows based on search text
  const publisherFilteredFlows = useMemo(() => {
    if (!publisherFilter.length) return flowDefinitions;
    return flowDefinitions.filter((flow) => publisherFilter.some((value) => flow.publisher?.split("; ").includes(value)));
  }, [flowDefinitions, publisherFilter]);

  const availableSolutionOptions = useMemo(() => {
    if (!publisherFilter.length) return solutionCatalog;
    return solutionCatalog.filter(
      (solution) => solution.publisherName && publisherFilter.includes(solution.publisherName),
    );
  }, [publisherFilter, solutionCatalog]);

  const filteredFlows = useMemo(() => {
    const searchText = filterText.toLowerCase();
    return publisherFilteredFlows.filter(
      (flow) =>
        (!searchText || [flow.name, flow.description, flow.trigger?.label, flow.connections.join(" "), flow.owner?.name, flow.owner?.email, flow.solution, flow.publisher, flow.createdby, flow.modifiedby].some((value) => value?.toLowerCase().includes(searchText))) &&
        (!solutionFilter.length || solutionFilter.some((value) => flow.solution?.split("; ").includes(value))) &&
        true
    );
  }, [publisherFilteredFlows, filterText, solutionFilter]);

  const selectedFlows = useMemo(() => flowDefinitions.filter((flow) => selectedFlowIds.includes(flow.workflowid)), [flowDefinitions, selectedFlowIds]);
  const clearSelection = useCallback(() => setSelectedFlowIds([]), []);
  const updateFilter = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, values: string[]) => {
    setter(values);
    clearSelection();
    const selectedSolutionNames = setter === setSolutionFilter ? values : solutionFilter;
    const selectedPublisherNames = setter === setPublisherFilter ? values : publisherFilter;
    if (setter === setPublisherFilter) setSolutionFilter([]);

    const matchingSolutions = solutionCatalog.filter((solution) =>
      (selectedSolutionNames.length === 0 || selectedSolutionNames.includes(solution.name)) &&
      (selectedPublisherNames.length === 0 || (solution.publisherName && selectedPublisherNames.includes(solution.publisherName))),
    );

    // No publisher or solution filter means the initial plain-flow result is sufficient.
    if (matchingSolutions.length === solutionCatalog.length && selectedSolutionNames.length === 0 && selectedPublisherNames.length === 0) {
      loadFlowDefinitions()
        .then(setFlowDefinitions)
        .catch((error) => logger.error(`Error loading flows: ${(error as Error).message}`));
      return;
    }

    setIsLoadingFlowDefinitons(true);
    loadFlowDefinitionsForSolutions(matchingSolutions.map((solution) => solution.id), solutionCatalog)
      .then(setFlowDefinitions)
      .catch((error) => logger.error(`Error loading filtered flows: ${(error as Error).message}`))
      .finally(() => setIsLoadingFlowDefinitons(false));
  }, [clearSelection, publisherFilter, solutionCatalog, solutionFilter]);

  const sortedFlows = useMemo(() => {
    if (!sortState.sortColumn) {
      return filteredFlows;
    }

    return [...filteredFlows].sort((a, b) => {
      const column = sortState.sortColumn!;
      let aValue = a[column];
      let bValue = b[column];

      // Handle dates
      if (column === "createdon" || column === "modifiedon") {
        aValue = new Date(aValue as Date).getTime();
        bValue = new Date(bValue as Date).getTime();
      }

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortState.sortDirection === "ascending" ? comparison : -comparison;
    });
  }, [filteredFlows, sortState]);

  const handleSort = useCallback((column: keyof FLowDefinition) => {
    setSortState((prev) => ({
      sortColumn: column,
      sortDirection:
        prev.sortColumn === column && prev.sortDirection === "ascending"
          ? "descending"
          : "ascending",
    }));
  }, []);

  const getSortIcon = (column: keyof FLowDefinition) => {
    if (sortState.sortColumn !== column) return null;
    return sortState.sortDirection === "ascending" ? (
      <ArrowUp16Regular />
    ) : (
      <ArrowDown16Regular />
    );
  };

  // Export handlers
  const handleCopyMarkdown = useCallback(async () => {
    await copyFlowDefinitionsAsMarkdown(selectedFlows, showNotification, diagramFormat);
  }, [selectedFlows, showNotification, diagramFormat]);

  const handleExportMarkdown = useCallback(async () => {
    await exportFlowDefinitionsToMarkdown(selectedFlows, diagramFormat, showNotification);
  }, [selectedFlows, diagramFormat, showNotification]);
  const toggleFlow = useCallback((id: string, checked: boolean) => setSelectedFlowIds((ids) => checked ? [...new Set([...ids, id])] : ids.filter((value) => value !== id)), []);
  const toggleRow = useCallback((id: string) => {
    setSelectedFlowIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  }, []);

  return (
    <>
      {isInitialLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Loading flows..." />
        </div>
      ) : (
        <div className={`card ${styles.root}`}>
          <div className={styles.filterContainer}>
            <Dropdown inlinePopup multiselect listbox={{ className: styles.dropdownListbox }} placeholder="Filter publishers" value={publisherFilter.join(", ")} selectedOptions={publisherFilter} onOptionSelect={(_, data) => updateFilter(setPublisherFilter, data.selectedOptions)}>
              {publisherOptions.map((value) => <Option key={value} value={value}>{value}</Option>)}
            </Dropdown>
            <Dropdown inlinePopup multiselect listbox={{ className: styles.dropdownListbox }} placeholder="Filter solutions" value={solutionFilter.join(", ")} selectedOptions={solutionFilter} onOptionSelect={(_, data) => updateFilter(setSolutionFilter, data.selectedOptions)}>
              {availableSolutionOptions.map((solution) => <Option key={solution.id} value={solution.name}>{solution.name}</Option>)}
            </Dropdown>
            <Input
              className={styles.searchInput}
              placeholder="Search by name or description..."
              value={filterText}
              onChange={(e) => { setFilterText(e.target.value); clearSelection(); }}
              contentBefore={<Search20Regular />}
            />
            {selectedFlows.length > 0 && <div className={styles.buttonGroup}>
              <Menu inline positioning="below-end">
                <MenuTrigger disableButtonEnhancement>
                  <Button appearance="primary" aria-label={`Actions for ${selectedFlows.length} selected flows`}>...</Button>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem icon={<Copy24Regular />} onClick={() => copyFlowDefinitionsAsCSV(selectedFlows, showNotification)}>
                      Copy CSV
                    </MenuItem>
                    <MenuItem icon={<DocumentTable24Regular />} onClick={handleCopyMarkdown}>
                      Copy Markdown
                    </MenuItem>
                    <MenuItem icon={<ArrowDownload24Regular />} onClick={() => exportFlowDefinitionsToCSV(selectedFlows, showNotification)}>
                      Export CSV
                    </MenuItem>
                    <MenuItem icon={<ArrowDownload24Regular />} onClick={() => setIsExportDialogOpen(true)}>
                      Export Markdown
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>}
          </div>
          <div className={styles.tableContainer}>
            {isLoadingFlowDefinitions && (
              <div className={styles.tableLoadingOverlay}>
                <Spinner label="Loading flows..." />
              </div>
            )}
            <Table size="small" className={styles.table}>
              <TableHeader className={styles.tableHeader}>
                <TableRow>
                  <TableHeaderCell className={styles.selectionCell}>
                    <Checkbox aria-label="Select all visible flows" checked={sortedFlows.length > 0 && sortedFlows.every((flow) => selectedFlowIds.includes(flow.workflowid))} onChange={(event, data) => { event.stopPropagation(); setSelectedFlowIds(data.checked ? sortedFlows.map((flow) => flow.workflowid) : []); }} />
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.sortableHeader} onClick={() => handleSort("name")} style={{ width: "280px" }}>
                    Name {getSortIcon("name")}
                  </TableHeaderCell>
                  <TableHeaderCell
                    className={styles.sortableHeader}
                    onClick={() => handleSort("description")}
                    style={{ width: "420px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Description {getSortIcon("description")}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className={styles.sortableHeader}
                    onClick={() => handleSort("statecode")}
                    style={{ width: "100px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      State {getSortIcon("statecode")}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className={styles.sortableHeader}
                    onClick={() => handleSort("createdon")}
                    style={{ width: "130px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Created On {getSortIcon("createdon")}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.sortableHeader} onClick={() => handleSort("modifiedon")} style={{ width: "130px" }}>
                    Modified On {getSortIcon("modifiedon")}
                  </TableHeaderCell>
                  <TableHeaderCell style={{ width: "180px" }}>Created By</TableHeaderCell>
                  <TableHeaderCell style={{ width: "180px" }}>Modified By</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Trigger</TableHeaderCell>
                  <TableHeaderCell style={{ width: "260px" }}>Connections</TableHeaderCell>
                  <TableHeaderCell style={{ width: "200px" }}>Owner</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFlows.map((flow) => {
                  const state = getStateLabel(flow.statecode);
                  return (
                    <TableRow
                      key={flow.workflowid}
                      className={`${styles.tableRow} ${styles.clickableRow} ${selectedFlowIds.includes(flow.workflowid) ? styles.selectedRow : ""}`}
                      onClick={() => toggleRow(flow.workflowid)}
                      aria-selected={selectedFlowIds.includes(flow.workflowid)}
                    >
                      <TableCell className={styles.selectionCell}>
                        <Checkbox aria-label={`Select ${flow.name}`} checked={selectedFlowIds.includes(flow.workflowid)} onChange={(event, data) => { event.stopPropagation(); toggleFlow(flow.workflowid, data.checked === true); }} />
                      </TableCell>
                      <TableCell style={{ width: "280px" }} className={styles.compactCell} title={flow.name}>
                        <TableCellLayout truncate>
                          <Link
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(flow);
                            }}
                          >
                            {flow.name}
                          </Link>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ width: "420px" }} className={styles.compactCell}>
                        <TableCellLayout
                          truncate
                          title={flow.description || "-"}
                        >
                          <Text>{flow.description || "-"}</Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ width: "100px" }}>
                        <TableCellLayout>
                          <Badge appearance="filled" color={state.color}>
                            {state.text}
                          </Badge>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ width: "130px" }}>
                        <TableCellLayout>
                          <Text>
                            {new Date(flow.createdon).toLocaleDateString()}
                          </Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ width: "130px" }}>
                        <TableCellLayout>
                          <Text>
                            {new Date(flow.modifiedon).toLocaleDateString()}
                          </Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ width: "180px" }} className={styles.compactCell}><Text title={flow.createdby}>{flow.createdby || "-"}</Text></TableCell>
                      <TableCell style={{ width: "180px" }} className={styles.compactCell}><Text title={flow.modifiedby}>{flow.modifiedby || "-"}</Text></TableCell>
                      <TableCell style={{ width: "200px" }} className={styles.compactCell}><Text title={flow.trigger?.label}>{flow.trigger?.label || "-"}</Text></TableCell>
                      <TableCell style={{ width: "260px" }} className={styles.compactCell}><Text title={flow.connections.join(", ")}>{flow.connections.join(", ") || "-"}</Text></TableCell>
                      <TableCell style={{ width: "200px" }} className={styles.compactCell}><Text title={flow.owner?.email}>{flow.owner?.name || flow.owner?.email || "-"}</Text></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {isDrawerOpen && (
        <>
          <div
            aria-hidden="true"
            className={styles.drawerBackdrop}
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside
            aria-label={selectedFlow?.name || "Flow Details"}
            className={styles.drawer}
          >
            <DrawerHeader>
              <DrawerHeaderTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="Close"
                    icon={<Dismiss24Regular />}
                    onClick={() => setIsDrawerOpen(false)}
                  />
                }
              >
                {selectedFlow?.name || "Flow Details"}
              </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody>
              <FlowDetails flow={selectedFlow} isDarkMode={isDarkMode} />
            </DrawerBody>
          </aside>
        </>
      )}

      {isExportDialogOpen && (
        <>
          <div
            aria-hidden="true"
            className={styles.dialogBackdrop}
            onClick={() => setIsExportDialogOpen(false)}
          />
          <div
            aria-label="Export Markdown"
            aria-modal="true"
            className={styles.dialogSurface}
            role="dialog"
          >
            <DialogBody>
              <DialogTitle>Export Markdown</DialogTitle>
              <DialogContent>
                <Text>Choose the diagram format for the selected flows.</Text>
                <RadioGroup value={diagramFormat} onChange={(_, data) => setDiagramFormat(data.value as DiagramFormat)}>
                  <Radio value="mermaid" label="Mermaid" />
                  <Radio value="plantuml" label="PlantUML" />
                </RadioGroup>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
                <Button appearance="primary" onClick={async () => { setIsExportDialogOpen(false); await handleExportMarkdown(); }}>Export</Button>
              </DialogActions>
            </DialogBody>
          </div>
        </>
      )}
    </>
  );
};
