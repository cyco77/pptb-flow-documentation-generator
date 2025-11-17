import React, { useState, useCallback, useEffect, useMemo } from "react";
import { loadFlowDefinitions } from "../services/dataverseService";
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
  tokens,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
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
    useState(false);
  const [filterText, setFilterText] = useState<string>("");
  const [sortState, setSortState] = useState<{
    sortColumn: keyof FLowDefinition | undefined;
    sortDirection: "ascending" | "descending";
  }>({ sortColumn: "name", sortDirection: "ascending" });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const useStyles = makeStyles({
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
    },
    tableContainer: {
      overflowX: "auto",
      position: "relative",
    },
    clickableRow: {
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
      },
    },
    sortableHeader: {
      cursor: "pointer",
      userSelect: "none",
      "&:hover": {
        backgroundColor: tokens.colorNeutralBackground1Hover,
      },
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
    },
    searchInput: {
      minWidth: "300px",
      flexGrow: 1,
    },
    buttonGroup: {
      display: "flex",
      gap: tokens.spacingHorizontalS,
    },
    drawer: {
      width: "80vw",
      maxWidth: "1400px",
    },
  });

  const styles = useStyles();

  useEffect(() => {
    const initialize = async () => {
      if (!connection) {
        return;
      }
      //querySdkSteps();
      queryFlowDefinitons();
    };

    initialize();
  }, [connection]);

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

  const queryFlowDefinitons = useCallback(async () => {
    try {
      setIsLoadingFlowDefinitons(true);
      const flowDefinitions = await loadFlowDefinitions();
      setFlowDefinitions(flowDefinitions);
      logger.info(`Fetched ${flowDefinitions.length} flow-definitions`);
    } catch (error) {
      logger.error(`Error querying sdk-steps: ${(error as Error).message}`);
    } finally {
      setIsLoadingFlowDefinitons(false);
    }
  }, [connection, showNotification]);

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

  // Filter flows based on search text
  const filteredFlows = useMemo(() => {
    if (!filterText.trim()) {
      return flowDefinitions;
    }

    const searchText = filterText.toLowerCase();
    return flowDefinitions.filter(
      (flow) =>
        flow.name.toLowerCase().includes(searchText) ||
        flow.description?.toLowerCase().includes(searchText) ||
        false
    );
  }, [flowDefinitions, filterText]);

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
  const handleExport = useCallback(async () => {
    await exportFlowDefinitionsToCSV(sortedFlows, showNotification);
  }, [sortedFlows, showNotification]);

  const handleCopyCSV = useCallback(async () => {
    await copyFlowDefinitionsAsCSV(sortedFlows, showNotification);
  }, [sortedFlows, showNotification]);

  const handleCopyMarkdown = useCallback(async () => {
    await copyFlowDefinitionsAsMarkdown(sortedFlows, showNotification);
  }, [sortedFlows, showNotification]);

  return (
    <>
      {isLoadingFlowDefinitions ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Loading flows..." />
        </div>
      ) : (
        <div className="card">
          <div className={styles.filterContainer}>
            <Input
              className={styles.searchInput}
              placeholder="Search by name or description..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              contentBefore={<Search20Regular />}
            />
            <div className={styles.buttonGroup}>
              <Button
                appearance="secondary"
                icon={<Copy24Regular />}
                onClick={handleCopyCSV}
                disabled={sortedFlows.length === 0}
              >
                Copy CSV
              </Button>
              <Button
                appearance="secondary"
                icon={<DocumentTable24Regular />}
                onClick={handleCopyMarkdown}
                disabled={sortedFlows.length === 0}
              >
                Copy Markdown
              </Button>
              <Button
                appearance="primary"
                icon={<ArrowDownload24Regular />}
                onClick={handleExport}
                disabled={sortedFlows.length === 0}
              >
                Export CSV
              </Button>
            </div>
          </div>
          <div className={styles.tableContainer}>
            <Table size="small" style={{ minWidth: "100%" }}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell
                    className={styles.sortableHeader}
                    onClick={() => handleSort("name")}
                    style={{ width: "25%", minWidth: "200px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Name {getSortIcon("name")}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className={styles.sortableHeader}
                    onClick={() => handleSort("description")}
                    style={{ width: "35%", minWidth: "200px" }}
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
                    style={{ width: "10%", minWidth: "100px" }}
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
                    style={{ width: "15%", minWidth: "120px" }}
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
                  <TableHeaderCell
                    className={styles.sortableHeader}
                    onClick={() => handleSort("modifiedon")}
                    style={{ width: "15%", minWidth: "120px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Modified On {getSortIcon("modifiedon")}
                    </div>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFlows.map((flow) => {
                  const state = getStateLabel(flow.statecode);
                  return (
                    <TableRow
                      key={flow.workflowid}
                      className={styles.clickableRow}
                      onClick={() => handleRowClick(flow)}
                    >
                      <TableCell style={{ width: "25%" }}>
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
                      <TableCell style={{ width: "35%" }}>
                        <TableCellLayout
                          truncate
                          title={flow.description || "-"}
                        >
                          <Text>{flow.description || "-"}</Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ width: "10%" }}>
                        <TableCellLayout>
                          <Badge appearance="filled" color={state.color}>
                            {state.text}
                          </Badge>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ width: "15%" }}>
                        <TableCellLayout>
                          <Text>
                            {new Date(flow.createdon).toLocaleDateString()}
                          </Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell style={{ width: "15%" }}>
                        <TableCellLayout>
                          <Text>
                            {new Date(flow.modifiedon).toLocaleDateString()}
                          </Text>
                        </TableCellLayout>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Drawer
        type="overlay"
        separator
        open={isDrawerOpen}
        onOpenChange={(_, { open }) => setIsDrawerOpen(open)}
        position="end"
        size="large"
        style={{ width: "80vw", maxWidth: "1400px" }}
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
      </Drawer>
    </>
  );
};
