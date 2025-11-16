import React, { useState, useCallback, useEffect, useMemo } from "react";
import { loadFlowDefinitions } from "../services/dataverseService";
import { FlowDetails } from "./FlowDetails";
import {
  Divider,
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
} from "@fluentui/react-components";
import {
  Search20Regular,
  ArrowDownload24Regular,
  Copy24Regular,
  DocumentTable24Regular,
} from "@fluentui/react-icons";
import { logger } from "../services/loggerService";
import { FLowDefinition } from "../types/flowDefinition";
import {
  exportFlowDefinitionsToCSV,
  copyFlowDefinitionsAsCSV,
  copyFlowDefinitionsAsMermaid,
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

  const useStyles = makeStyles({
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
    },
    tableContainer: {
      overflowX: "auto",
    },
    clickableRow: {
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
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

  const sortedFlows = useMemo(
    () => [...filteredFlows].sort((a, b) => a.name.localeCompare(b.name)),
    [filteredFlows]
  );

  // Export handlers
  const handleExport = useCallback(async () => {
    await exportFlowDefinitionsToCSV(sortedFlows, showNotification);
  }, [sortedFlows, showNotification]);

  const handleCopyCSV = useCallback(async () => {
    await copyFlowDefinitionsAsCSV(sortedFlows, showNotification);
  }, [sortedFlows, showNotification]);

  const handleCopyMermaid = useCallback(async () => {
    await copyFlowDefinitionsAsMermaid(sortedFlows, showNotification);
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
                onClick={handleCopyMermaid}
                disabled={sortedFlows.length === 0}
              >
                Copy Mermaid
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>State</TableHeaderCell>
                  <TableHeaderCell>Created On</TableHeaderCell>
                  <TableHeaderCell>Modified On</TableHeaderCell>
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
                      <TableCell>
                        <TableCellLayout>
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
                      <TableCell>
                        <TableCellLayout>
                          <Text>{flow.description || "-"}</Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout>
                          <Badge appearance="filled" color={state.color}>
                            {state.text}
                          </Badge>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout>
                          <Text>
                            {new Date(flow.createdon).toLocaleDateString()}
                          </Text>
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
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

      <Divider />

      <FlowDetails flow={selectedFlow} isDarkMode={isDarkMode} />
    </>
  );
};
