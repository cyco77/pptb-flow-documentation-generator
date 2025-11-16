import { useCallback, useEffect, useState } from "react";
import { logger } from "../services/loggerService";

export type LogEntry = {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
};

export function useEventLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Set up the logger callback when the hook is used
  useEffect(() => {
    const addLogToState = (
      message: string,
      type: LogEntry["type"] = "info"
    ) => {
      setLogs((prev) => [
        {
          timestamp: new Date(),
          message,
          type,
        },
        ...prev.slice(0, 49), // Keep last 50 entries
      ]);
      console.log(`[${type.toUpperCase()}] ${message}`);
    };

    // Set the logger callback
    logger.setLogCallback(addLogToState);

    // Cleanup: reset logger callback when component unmounts
    return () => {
      logger.setLogCallback(() => {});
    };
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, clearLogs };
}
