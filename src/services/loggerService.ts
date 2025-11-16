export type LogType = "info" | "success" | "warning" | "error";

type LogCallback = (message: string, type?: LogType) => void;

/**
 * Centralized logger service
 */
class LoggerService {
  private logCallback: LogCallback | null = null;

  /**
   * Sets the log callback function
   */
  setLogCallback(callback: LogCallback): void {
    this.logCallback = callback;
  }

  /**
   * Logs a message
   */
  log(message: string, type: LogType = "info"): void {
    if (this.logCallback) {
      this.logCallback(message, type);
    } else {
      // Fallback to console if no callback is set
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Logs an info message
   */
  info(message: string): void {
    this.log(message, "info");
  }

  /**
   * Logs a success message
   */
  success(message: string): void {
    this.log(message, "success");
  }

  /**
   * Logs a warning message
   */
  warning(message: string): void {
    this.log(message, "warning");
  }

  /**
   * Logs an error message
   */
  error(message: string): void {
    this.log(message, "error");
  }
}

// Export a singleton instance
export const logger = new LoggerService();
