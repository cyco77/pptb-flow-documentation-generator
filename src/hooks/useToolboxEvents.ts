import { useEffect } from "react";

export function useToolboxEvents(onEvent: (event: string, data: any) => void) {
  useEffect(() => {
    const handler = (_event: any, payload: ToolBoxAPI.ToolBoxEventPayload) => {
      console.log(`Toolbox event received: ${payload.event}`, payload.data);
      onEvent(payload.event, payload.data);
    };

    window.toolboxAPI.events.on(handler);

    return () => {
      // Note: Current API doesn't support unsubscribe
      // This would need to be added to the API
    };
  }, [onEvent]);
}
