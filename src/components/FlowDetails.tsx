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
} from "@fluentui/react-components";
import {
  ArrowDownload24Regular,
  Eye24Regular,
  Code24Regular,
  DocumentData24Regular,
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

  const useStyles = makeStyles({
    header: {
      marginBottom: "20px",
    },
    detailsGrid: {
      display: "grid",
      gridTemplateColumns: "150px 1fr",
      gap: "12px",
      marginBottom: "24px",
    },
    label: {
      fontWeight: "600",
    },
    diagramContainer: {
      marginTop: "24px",
      padding: "20px",
      backgroundColor: tokens.colorNeutralBackground3,
      borderRadius: tokens.borderRadiusMedium,
      overflow: "auto",
    },
    diagramHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    tabsContainer: {
      marginBottom: "16px",
    },
    codeBlock: {
      padding: "16px",
      backgroundColor: tokens.colorNeutralBackground1,
      borderRadius: tokens.borderRadiusSmall,
      overflow: "auto",
      maxHeight: "600px",
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
          header={
            <Text weight="semibold" size={600}>
              {flow.name}
            </Text>
          }
          description={flow.description || "No description available"}
        />

        <div className={styles.detailsGrid}>
          <Text className={styles.label}>Workflow ID:</Text>
          <Text>{flow.workflowid}</Text>

          <Text className={styles.label}>Created On:</Text>
          <Text>{flow.createdon.toLocaleString()}</Text>

          <Text className={styles.label}>Modified On:</Text>
          <Text>{flow.modifiedon.toLocaleString()}</Text>

          <Text className={styles.label}>State:</Text>
          <Text>
            {flow.statecode === 0
              ? "Draft"
              : flow.statecode === 1
              ? "Active"
              : "Inactive"}
          </Text>
        </div>

        <div className={styles.diagramContainer}>
          <div className={styles.diagramHeader}>
            <Text weight="semibold" size={500}>
              Flow Output
            </Text>
            <Button
              appearance="secondary"
              icon={<ArrowDownload24Regular />}
              onClick={handleExportSVG}
              disabled={viewMode !== "diagram" || isRendering || !!error}
            >
              Export SVG
            </Button>
          </div>

          <div className={styles.tabsContainer}>
            <TabList
              selectedValue={viewMode}
              onTabSelect={(_, data) => setViewMode(data.value as ViewMode)}
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
          </div>

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

              <div ref={mermaidRef} />
            </>
          )}

          {viewMode === "mermaid" && (
            <div className={styles.codeBlock}>{mermaidCode}</div>
          )}

          {viewMode === "json" && (
            <div className={styles.codeBlock}>
              {flow.clientdata
                ? JSON.stringify(JSON.parse(flow.clientdata), null, 2)
                : "No data available"}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
