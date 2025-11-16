import { useCallback, useEffect, useState } from "react";

export function useConnection() {
  const [connection, setConnection] =
    useState<ToolBoxAPI.DataverseConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConnection = useCallback(async () => {
    try {
      const conn = await window.toolboxAPI.connections.getActiveConnection();
      setConnection(conn);
    } catch (error) {
      console.error("Error refreshing connection:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConnection();
  }, [refreshConnection]);

  return { connection, isLoading, refreshConnection };
}
