import React from "react";
import {
  Card,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
  TableCellLayout,
  makeStyles,
  tokens,
  Text,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useEventLog, type LogEntry } from "../hooks/useToolboxAPI";

const useStyles = makeStyles({
  card: {
    maxWidth: "100%",
    width: "100%",
    display: "block",
    position: "relative",
  },
  tableContainer: {
    marginTop: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  table: {
    minHeight: "0",
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },
  timestampCell: {
    width: "140px",
  },
  typeCell: {
    width: "80px",
  },
  successText: {
    color: tokens.colorPaletteGreenForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  infoText: {
    color: tokens.colorPaletteBlueForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  warningText: {
    color: tokens.colorPaletteYellowForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export const EventLog: React.FC = () => {
  const { logs, clearLogs } = useEventLog();

  const styles = useStyles();

  const getTypeStyle = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return styles.successText;
      case "info":
        return styles.infoText;
      case "warning":
        return styles.warningText;
      case "error":
        return styles.errorText;
      default:
        return "";
    }
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            📋 Event Log
          </Text>
        }
        action={
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={clearLogs}
          >
            Clear Log
          </Button>
        }
      />

      {logs.length === 0 ? (
        <div className={styles.emptyState}>No logs yet...</div>
      ) : (
        <div className={styles.tableContainer}>
          <Table className={styles.table} size="small">
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={styles.timestampCell}>
                  Timestamp
                </TableHeaderCell>
                <TableHeaderCell className={styles.typeCell}>
                  Type
                </TableHeaderCell>
                <TableHeaderCell>Message</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell className={styles.timestampCell}>
                    <TableCellLayout>
                      {log.timestamp.toLocaleTimeString()}
                    </TableCellLayout>
                  </TableCell>
                  <TableCell className={styles.typeCell}>
                    <TableCellLayout>
                      <Text className={getTypeStyle(log.type)}>
                        {log.type.toUpperCase()}
                      </Text>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>{log.message}</TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
