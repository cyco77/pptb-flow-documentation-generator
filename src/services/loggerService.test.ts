import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "./loggerService";

describe("logger", () => {
  beforeEach(() => logger.setLogCallback(() => undefined));

  it("forwards each log level through the registered callback", () => {
    const callback = vi.fn();
    logger.setLogCallback(callback);
    logger.log("plain");
    logger.info("info");
    logger.success("success");
    logger.warning("warning");
    logger.error("error");
    expect(callback.mock.calls).toEqual([
      ["plain", "info"], ["info", "info"], ["success", "success"], ["warning", "warning"], ["error", "error"],
    ]);
  });

  it("falls back to console when there is no callback", () => {
    logger.setLogCallback(null as never);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    logger.warning("message");
    expect(log).toHaveBeenCalledWith("[WARNING] message");
  });
});
