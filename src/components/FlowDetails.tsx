import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  makeStyles,
  Text,
  Spinner,
  tokens,
  Button,
  Tab,
  TabList,
  Slider,
} from "@fluentui/react-components";
import {
  ArrowDownload24Regular,
  Eye24Regular,
  Code24Regular,
  DocumentData24Regular,
  ZoomIn20Regular,
  ZoomOut20Regular,
  ZoomFit20Regular,
  Copy24Regular,
} from "@fluentui/react-icons";
import { FLowDefinition } from "../types/flowDefinition";
import { convertToMermaid } from "../utils/Flow2MermaidConverter";
import { logger } from "../services/loggerService";
import mermaid from "mermaid";

type ViewMode = "diagram" | "mermaid" | "json";

interface IFlowDetailsProps {
  flow: FLowDefinition | undefined;
  isDarkMode: boolean;
}

export const FlowDetails: React.FC<IFlowDetailsProps> = ({
  flow,
  isDarkMode,
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("diagram");
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const useStyles = makeStyles({
    header: {
      marginBottom: "20px",
    },
    detailsGrid: {
      display: "grid",
      gridTemplateColumns: "auto 1fr auto 1fr",
      gap: "12px 24px",
      marginBottom: "24px",
    },
    label: {
      fontWeight: "600",
    },
    diagramContainer: {
      backgroundColor: tokens.colorNeutralBackground3,
      borderRadius: tokens.borderRadiusMedium,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      maxHeight: "calc(100vh - 230px)",
    },
    tabsAndControlsContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 20px",
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      flexShrink: 0,
      gap: tokens.spacingHorizontalM,
    },
    controlsGroup: {
      display: "flex",
      gap: tokens.spacingHorizontalS,
      alignItems: "center",
    },
    zoomControls: {
      display: "flex",
      gap: tokens.spacingHorizontalXS,
      alignItems: "center",
      minWidth: "250px",
    },
    zoomSlider: {
      width: "120px",
    },
    diagramContent: {
      flex: 1,
      overflow: "auto",
      padding: "20px",
    },
    diagramWrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      minHeight: "400px",
    },
    codeBlock: {
      padding: "16px",
      backgroundColor: tokens.colorNeutralBackground1,
      borderRadius: tokens.borderRadiusSmall,
      overflow: "auto",
      maxHeight: "calc(100vh - 330px)",
      fontFamily: "monospace",
      fontSize: "12px",
      whiteSpace: "pre",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
    },
    errorContainer: {
      padding: "20px",
      backgroundColor: tokens.colorPaletteRedBackground2,
      borderRadius: tokens.borderRadiusMedium,
      color: tokens.colorPaletteRedForeground1,
    },
  });

  const styles = useStyles();

  // Initialize mermaid with theme awareness
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? "dark" : "base",
      securityLevel: "loose",
      themeVariables: isDarkMode
        ? {}
        : {
            // Modern, fresh color scheme for light mode
            primaryColor: "#e3f2fd",
            primaryTextColor: "#1565c0",
            primaryBorderColor: "#1976d2",
            lineColor: "#42a5f5",
            secondaryColor: "#f3e5f5",
            tertiaryColor: "#e8f5e9",
            background: "#ffffff",
            mainBkg: "#e3f2fd",
            secondBkg: "#f3e5f5",
            tertiaryBkg: "#e8f5e9",
            primaryBorderWidth: "2px",
            fontSize: "14px",
            nodeBorder: "#1976d2",
            clusterBkg: "#fafafa",
            clusterBorder: "#bdbdbd",
            defaultLinkColor: "#42a5f5",
            titleColor: "#1565c0",
            edgeLabelBackground: "#ffffff",
            actorBorder: "#1976d2",
            actorBkg: "#e3f2fd",
            actorTextColor: "#1565c0",
            actorLineColor: "#42a5f5",
            signalColor: "#1565c0",
            signalTextColor: "#1565c0",
            labelBoxBkgColor: "#e3f2fd",
            labelBoxBorderColor: "#1976d2",
            labelTextColor: "#1565c0",
            noteBorderColor: "#1976d2",
            noteBkgColor: "#fff9c4",
            noteTextColor: "#1565c0",
          },
    });
  }, [isDarkMode]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (
        !flow ||
        !flow.clientdata ||
        !mermaidRef.current ||
        viewMode !== "diagram"
      ) {
        return;
      }

      try {
        setIsRendering(true);
        setError(null);

        // Convert flow to mermaid syntax
        const mermaidSyntax = convertToMermaid(flow.clientdata);

        if (mermaidSyntax === "Error parsing JSON") {
          setError("Failed to parse flow definition");
          return;
        }

        // Store mermaid code for display
        setMermaidCode(mermaidSyntax);

        // Clear previous content
        mermaidRef.current.innerHTML = "";

        // Render the diagram
        const { svg } = await mermaid.render(
          `mermaid-${flow.workflowid}-${Date.now()}`,
          mermaidSyntax
        );

        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error("Error rendering diagram:", err);
        setError(`Error rendering diagram: ${(err as Error).message}`);
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [flow, viewMode]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const handleCopyMermaid = useCallback(async () => {
    try {
      await window.toolboxAPI.utils.copyToClipboard(mermaidCode);
      logger.success("Copied Mermaid code to clipboard");
      await window.toolboxAPI.utils.showNotification({
        title: "Copy Successful",
        body: "Mermaid code copied to clipboard",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      logger.error(`Error copying to clipboard: ${(error as Error).message}`);
    }
  }, [mermaidCode]);

  const handleCopyJSON = useCallback(async () => {
    if (!flow?.clientdata) return;
    try {
      const jsonString = JSON.stringify(JSON.parse(flow.clientdata), null, 2);
      await window.toolboxAPI.utils.copyToClipboard(jsonString);
      logger.success("Copied JSON to clipboard");
      await window.toolboxAPI.utils.showNotification({
        title: "Copy Successful",
        body: "JSON copied to clipboard",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      logger.error(`Error copying to clipboard: ${(error as Error).message}`);
    }
  }, [flow]);

  // Add mouse wheel zoom functionality
  useEffect(() => {
    const diagramElement = mermaidRef.current?.parentElement;
    if (!diagramElement || viewMode !== "diagram") return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom when Ctrl (or Cmd on Mac) is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel((prev) => {
          const newZoom = prev + delta;
          return Math.max(0.5, Math.min(6, newZoom));
        });
      }
    };

    diagramElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      diagramElement.removeEventListener("wheel", handleWheel);
    };
  }, [viewMode]);

  const handleExportSVG = useCallback(async () => {
    if (!mermaidRef.current || !flow) {
      return;
    }

    try {
      // Get the SVG element from the mermaid container
      const svgElement = mermaidRef.current.querySelector("svg");

      if (!svgElement) {
        logger.error("No SVG element found to export");
        await window.toolboxAPI.utils.showNotification({
          title: "Export Failed",
          body: "No diagram available to export",
          type: "error",
          duration: 3000,
        });
        return;
      }

      // Clone the SVG to avoid modifying the displayed one
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;

      // Get the SVG as a string
      const svgString = new XMLSerializer().serializeToString(clonedSvg);

      const filename = `${flow.name.replace(/[^a-z0-9]/gi, "_")}_diagram.svg`;

      try {
        await window.toolboxAPI.utils.saveFile(filename, svgString);

        logger.success(`Exported diagram as ${filename}`);
        await window.toolboxAPI.utils.showNotification({
          title: "Export Successful",
          body: `Diagram exported as ${filename}`,
          type: "success",
          duration: 3000,
        });
      } catch (saveError) {
        logger.error(`Error saving file: ${(saveError as Error).message}`);
        await window.toolboxAPI.utils.showNotification({
          title: "Export Failed",
          body: `Error saving file: ${(saveError as Error).message}`,
          type: "error",
          duration: 3000,
        });
      }
    } catch (error) {
      logger.error(`Error exporting SVG: ${(error as Error).message}`);
      await window.toolboxAPI.utils.showNotification({
        title: "Export Failed",
        body: `Error exporting diagram: ${(error as Error).message}`,
        type: "error",
        duration: 3000,
      });
    }
  }, [flow]);

  const handleCopySVG = useCallback(async () => {
    if (!mermaidRef.current || !flow) {
      return;
    }

    try {
      // Get the SVG element from the mermaid container
      const svgElement = mermaidRef.current.querySelector("svg");

      if (!svgElement) {
        logger.error("No SVG element found to copy");
        await window.toolboxAPI.utils.showNotification({
          title: "Copy Failed",
          body: "No diagram available to copy",
          type: "error",
          duration: 3000,
        });
        return;
      }

      // Clone the SVG to avoid modifying the displayed one
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;

      // Get the SVG as a string
      const svgString = new XMLSerializer().serializeToString(clonedSvg);

      await window.toolboxAPI.utils.copyToClipboard(svgString);

      logger.success("Copied SVG to clipboard");
      await window.toolboxAPI.utils.showNotification({
        title: "Copy Successful",
        body: "SVG diagram copied to clipboard",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      logger.error(`Error copying SVG: ${(error as Error).message}`);
      await window.toolboxAPI.utils.showNotification({
        title: "Copy Failed",
        body: `Error copying diagram: ${(error as Error).message}`,
        type: "error",
        duration: 3000,
      });
    }
  }, [flow]);

  if (!flow) {
    return (
      <div>
        <Text size={400}>Please select a flow from the dropdown above.</Text>
      </div>
    );
  }

  return (
    <div className="card">
      <Card>
        <CardHeader
          description={flow.description || "No description available"}
        />

        <div className={styles.detailsGrid}>
          <Text className={styles.label}>State:</Text>
          <Text>
            {flow.statecode === 0
              ? "Draft"
              : flow.statecode === 1
              ? "Active"
              : "Inactive"}
          </Text>

          <Text className={styles.label}>Workflow ID:</Text>
          <Text>{flow.workflowid}</Text>

          <Text className={styles.label}>Created On:</Text>
          <Text>{flow.createdon.toLocaleString()}</Text>

          <Text className={styles.label}>Modified On:</Text>
          <Text>{flow.modifiedon.toLocaleString()}</Text>
        </div>

        <div className={styles.diagramContainer}>
          <div className={styles.tabsAndControlsContainer}>
            <TabList
              selectedValue={viewMode}
              onTabSelect={(_, data) => setViewMode(data.value as ViewMode)}
              size="small"
            >
              <Tab value="diagram" icon={<Eye24Regular />}>
                Diagram
              </Tab>
              <Tab value="mermaid" icon={<Code24Regular />}>
                Mermaid Code
              </Tab>
              <Tab value="json" icon={<DocumentData24Regular />}>
                JSON
              </Tab>
            </TabList>

            <div className={styles.controlsGroup}>
              {viewMode === "diagram" && (
                <>
                  <div className={styles.zoomControls}>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ZoomOut20Regular />}
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 0.5}
                      title="Zoom Out"
                    />
                    <Slider
                      className={styles.zoomSlider}
                      min={0.5}
                      max={10}
                      step={0.1}
                      value={zoomLevel}
                      onChange={(_, data) => setZoomLevel(data.value)}
                      aria-label="Zoom level"
                    />
                    <Text size={200} style={{ minWidth: "45px" }}>
                      {Math.round(zoomLevel * 100)}%
                    </Text>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ZoomIn20Regular />}
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 10}
                      title="Zoom In"
                    />
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ZoomFit20Regular />}
                      onClick={handleZoomReset}
                      title="Reset Zoom"
                    />
                  </div>
                  <Button
                    appearance="secondary"
                    size="small"
                    icon={<Copy24Regular />}
                    onClick={handleCopySVG}
                    disabled={isRendering || !!error}
                  >
                    Copy SVG
                  </Button>
                  <Button
                    appearance="secondary"
                    size="small"
                    icon={<ArrowDownload24Regular />}
                    onClick={handleExportSVG}
                    disabled={isRendering || !!error}
                  >
                    Export SVG
                  </Button>
                </>
              )}

              {viewMode === "mermaid" && (
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<Copy24Regular />}
                  onClick={handleCopyMermaid}
                >
                  Copy to Clipboard
                </Button>
              )}

              {viewMode === "json" && (
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<Copy24Regular />}
                  onClick={handleCopyJSON}
                >
                  Copy to Clipboard
                </Button>
              )}
            </div>
          </div>

          <div className={styles.diagramContent}>
            {viewMode === "diagram" && (
              <>
                {isRendering && (
                  <div className={styles.loadingContainer}>
                    <Spinner label="Rendering diagram..." />
                  </div>
                )}

                {error && (
                  <div className={styles.errorContainer}>
                    <Text>{error}</Text>
                  </div>
                )}

                <div className={styles.diagramWrapper}>
                  <div
                    ref={mermaidRef}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "top center",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>
              </>
            )}

            {viewMode === "mermaid" && (
              <div className={styles.codeBlock}>
                {mermaidCode.replace(/;/g, ";\n")}
              </div>
            )}

            {viewMode === "json" && (
              <div className={styles.codeBlock}>
                {flow.clientdata
                  ? JSON.stringify(JSON.parse(flow.clientdata), null, 2)
                  : "No data available"}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
