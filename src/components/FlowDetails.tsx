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
import {
  convertToMermaid,
  MermaidResult,
} from "../utils/Flow2MermaidConverter";
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
  const jsonRef = useRef<HTMLPreElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("diagram");
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [legend, setLegend] = useState<
    Array<{ label: string; color: string; border: string }>
  >([]);
  const [zoomLevel, setZoomLevel] = useState<number>(0.5);
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

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
      minHeight: "400px",
      minWidth: "100%",
    },
    diagramCanvas: {
      position: "relative",
      flexShrink: 0,
      marginLeft: "auto",
      marginRight: "auto",
      width: "fit-content",
    },
    codeBlock: {
      padding: "16px",
      backgroundColor: tokens.colorNeutralBackground1,
      borderRadius: tokens.borderRadiusSmall,
      overflow: "auto",
      maxHeight: "calc(100vh - 370px)",
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
    legendContainer: {
      position: "absolute",
      top: "70px",
      left: "10px",
      zIndex: 10,
      backgroundColor: tokens.colorNeutralBackground1,
      borderRadius: tokens.borderRadiusSmall,
      padding: "8px 12px",
      boxShadow: tokens.shadow4,
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    legendTitle: {
      fontWeight: "600",
      fontSize: "12px",
      marginBottom: "4px",
      color: tokens.colorNeutralForeground1,
    },
    legendItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "11px",
    },
    legendColorBox: {
      width: "16px",
      height: "16px",
      borderRadius: "2px",
      border: "2px solid",
    },
    searchContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      backgroundColor: tokens.colorNeutralBackground1,
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    searchInput: {
      flex: 1,
      padding: "4px 8px",
      borderRadius: tokens.borderRadiusSmall,
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      fontSize: "12px",
    },
    searchMatchCount: {
      fontSize: "12px",
      color: tokens.colorNeutralForeground2,
      whiteSpace: "nowrap",
    },
    searchButton: {
      padding: "2px 8px",
      fontSize: "12px",
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
        const result: MermaidResult = convertToMermaid(flow.clientdata);
        const mermaidSyntax = result.diagram;

        if (mermaidSyntax === "Error parsing JSON") {
          setError("Failed to parse flow definition");
          return;
        }

        // Store mermaid code for display
        setMermaidCode(mermaidSyntax);

        // Store legend data
        setLegend(result.legend);

        // Clear previous content
        mermaidRef.current.innerHTML = "";

        // Render the diagram
        const { svg } = await mermaid.render(
          `mermaid-${flow.workflowid}-${Date.now()}`,
          mermaidSyntax,
        );

        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;

          const svgElement = mermaidRef.current.querySelector("svg");
          if (svgElement) {
            const viewBox = svgElement.viewBox?.baseVal;
            const width =
              viewBox && viewBox.width
                ? viewBox.width
                : svgElement.getBoundingClientRect().width;
            const height =
              viewBox && viewBox.height
                ? viewBox.height
                : svgElement.getBoundingClientRect().height;

            setDiagramSize({ width, height });
          }
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

  useEffect(() => {
    if (!mermaidRef.current) {
      return;
    }

    const svgElement = mermaidRef.current.querySelector("svg");
    if (!svgElement || !diagramSize.width || !diagramSize.height) {
      return;
    }

    svgElement.style.width = `${diagramSize.width * zoomLevel}px`;
    svgElement.style.height = `${diagramSize.height * zoomLevel}px`;
    svgElement.style.maxWidth = "none";
    svgElement.style.display = "block";
  }, [zoomLevel, diagramSize]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(0.5);
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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !jsonRef.current) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      return;
    }
    const text = jsonRef.current.textContent || "";
    const matches: number[] = [];
    let idx = 0;
    while ((idx = text.indexOf(query, idx)) !== -1) {
      matches.push(idx);
      idx += 1;
    }
    setSearchMatches(matches);
    setCurrentMatchIndex(0);
  }, []);

  const highlightMatch = (index: number, query: string, matches: number[]) => {
    if (!jsonRef.current || matches.length === 0) return;

    const text = jsonRef.current;
    const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT, null);
    let charCount = 0;
    let found = false;
    let range: Range | null = null;
    let node: Text | null;

    while ((node = walker.nextNode() as Text | null)) {
      const nodeLength = node.textContent?.length || 0;
      if (charCount + nodeLength > matches[index]) {
        const offset = matches[index] - charCount;
        range = document.createRange();
        range.setStart(node, offset);
        range.setEnd(node, Math.min(offset + query.length, nodeLength));
        found = true;
        break;
      }
      charCount += nodeLength;
    }

    if (!found || !range) return;

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const rect = range.getBoundingClientRect();
    const container = text.parentElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const relativeTop = rect.top - containerRect.top;
      container.scrollTop = scrollTop + relativeTop - 100;
    }
  };

  const handleNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
    requestAnimationFrame(() => {
      highlightMatch(nextIndex, searchQuery, searchMatches);
    });
  }, [searchMatches, currentMatchIndex, searchQuery]);

  const handlePrevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const prevIndex =
      (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIndex);
    requestAnimationFrame(() => {
      highlightMatch(prevIndex, searchQuery, searchMatches);
    });
  }, [searchMatches, currentMatchIndex, searchQuery]);

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
          return Math.max(0.5, Math.min(3, newZoom));
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

      const svgString = serializeSvg(svgElement);

      const filename = `${flow.name.replace(/[^a-z0-9]/gi, "_")}_diagram.svg`;

      try {
        await window.toolboxAPI.fileSystem.saveFile(filename, svgString);

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

  const handleExportPNG = useCallback(async () => {
    if (!mermaidRef.current || !flow) {
      return;
    }

    try {
      const svgElement = mermaidRef.current.querySelector("svg");

      if (!svgElement) {
        logger.error("No SVG element found to export as PNG");
        await window.toolboxAPI.utils.showNotification({
          title: "Export Failed",
          body: "No diagram available to export",
          type: "error",
          duration: 3000,
        });
        return;
      }

      const svgString = serializeSvg(svgElement);
      const pngBlob = await renderSvgToPngBlob(svgString);
      const filename = `${flow.name.replace(/[^a-z0-9]/gi, "_")}_diagram.png`;
      const url = URL.createObjectURL(pngBlob);

      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        logger.success(`Exported diagram as ${filename}`);
        await window.toolboxAPI.utils.showNotification({
          title: "Export Successful",
          body: `Diagram exported as ${filename}`,
          type: "success",
          duration: 3000,
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error(`Error exporting PNG: ${(error as Error).message}`);
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

      const svgString = serializeSvg(svgElement);

      if (navigator.clipboard && "write" in navigator.clipboard) {
        const pngBlob = await renderSvgToPngBlob(svgString);
        const clipboardItem = new ClipboardItem({
          "image/png": pngBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await window.toolboxAPI.utils.copyToClipboard(svgString);
      }

      logger.success("Copied SVG to clipboard");
      await window.toolboxAPI.utils.showNotification({
        title: "Copy Successful",
        body: "Diagram copied to clipboard",
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

  const renderSvgToPngBlob = async (svgString: string): Promise<Blob> => {
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Failed to render SVG for clipboard copy"));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to create canvas context");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!pngBlob) {
      throw new Error("Failed to create PNG for clipboard copy");
    }

    return pngBlob;
  };

  const serializeSvg = (svgElement: SVGElement): string => {
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    const viewBox = clonedSvg.viewBox?.baseVal;
    if (viewBox && viewBox.width && viewBox.height) {
      clonedSvg.setAttribute("width", String(viewBox.width));
      clonedSvg.setAttribute("height", String(viewBox.height));
    }

    clonedSvg.style.removeProperty("width");
    clonedSvg.style.removeProperty("height");
    clonedSvg.style.removeProperty("max-width");

    return new XMLSerializer().serializeToString(clonedSvg);
  };

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
                      max={3}
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
                      disabled={zoomLevel >= 3}
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
                    Copy Diagram
                  </Button>
                  <Button
                    appearance="secondary"
                    size="small"
                    icon={<ArrowDownload24Regular />}
                    onClick={handleExportPNG}
                    disabled={isRendering || !!error}
                  >
                    Export PNG
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
                  {legend.length > 0 && (
                    <div className={styles.legendContainer}>
                      <div className={styles.legendTitle}>Legend</div>
                      {legend.map((item) => (
                        <div key={item.label} className={styles.legendItem}>
                          <div
                            className={styles.legendColorBox}
                            style={{
                              backgroundColor: item.color,
                              borderColor: item.border,
                            }}
                          />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.diagramCanvas}>
                    <div
                      ref={mermaidRef}
                      style={{ transition: "all 0.2s ease" }}
                    />
                  </div>
                </div>
              </>
            )}

            {viewMode === "mermaid" && (
              <div className={styles.codeBlock}>
                {mermaidCode.replace(/;/g, ";\n")}
              </div>
            )}

            {viewMode === "json" && (
              <>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search in JSON..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (e.shiftKey) {
                          handlePrevMatch();
                        } else {
                          handleNextMatch();
                        }
                      }
                    }}
                  />
                  <Button
                    size="small"
                    className={styles.searchButton}
                    onClick={handlePrevMatch}
                    disabled={searchMatches.length === 0}
                    appearance="subtle"
                  >
                    Prev
                  </Button>
                  <Button
                    size="small"
                    className={styles.searchButton}
                    onClick={handleNextMatch}
                    disabled={searchMatches.length === 0}
                    appearance="subtle"
                  >
                    Next
                  </Button>
                  <span className={styles.searchMatchCount}>
                    {searchMatches.length > 0
                      ? `${currentMatchIndex + 1} / ${searchMatches.length}`
                      : searchQuery
                        ? "No matches"
                        : ""}
                  </span>
                </div>
                <pre ref={jsonRef} className={styles.codeBlock}>
                  {flow.clientdata
                    ? JSON.stringify(JSON.parse(flow.clientdata), null, 2)
                    : "No data available"}
                </pre>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
