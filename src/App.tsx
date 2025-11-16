import { useCallback, useEffect, useState } from "react";
import { Overview } from "./components/Overview";
import { useConnection } from "./hooks/useConnection";
import { useToolboxEvents } from "./hooks/useToolboxEvents";
import { logger } from "./services/loggerService";
import {
  FluentProvider,
  Theme,
  teamsLightTheme,
  teamsDarkTheme,
  makeStyles,
  tokens,
  Title3,
  Text,
} from "@fluentui/react-components";
import iconImage from "../icon/flow-documentation_small.png";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    padding: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  headerIcon: {
    height: "50px",
    objectFit: "contain",
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: tokens.spacingVerticalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
});

function App() {
  const { connection, refreshConnection } = useConnection();

  const [theme, setTheme] = useState<Theme>(teamsDarkTheme);
  const styles = useStyles();
  // Handle platform events
  const handleEvent = useCallback(
    (event: string, _data: any) => {
      console.log(`Received event: ${event}`);
      switch (event) {
        case "connection:updated":
        case "connection:created":
          refreshConnection();
          break;

        case "connection:deleted":
          refreshConnection();
          break;

        case "terminal:output":
        case "terminal:command:completed":
        case "terminal:error":
          // Terminal events handled by dedicated components
          break;
        case "settings:updated":
          // Settings updated, could refresh settings if needed
          updateThemeBasedOnSettings();
          logger.info(`Settings updated`);
          break;
      }
    },
    [refreshConnection]
  );

  async function updateThemeBasedOnSettings() {
    const theme = await window.toolboxAPI.utils.getCurrentTheme();
    if (theme === "dark") {
      setTheme(teamsDarkTheme);
    } else {
      setTheme(teamsLightTheme);
    }
    logger.info(`Theme updated:${theme}`);
  }

  useToolboxEvents(handleEvent);

  // Add initial log (run only once on mount)
  useEffect(() => {
    const initialite = async () => {
      await updateThemeBasedOnSettings();
      logger.info(`Initialized`);
    };

    initialite();
  }, []);

  return (
    <FluentProvider theme={theme} className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <img
            src={iconImage}
            alt="Plugin Documentation Generator Icon"
            className={styles.headerIcon}
          />
          <Title3>Flow Documentation Generator</Title3>
          <Text className={styles.subtitle}>
            Your tool to generate Power Automate Flow documentation
          </Text>
        </div>
      </div>
      <div className={styles.content}>
        <Overview
          connection={connection}
          isDarkMode={theme === teamsDarkTheme}
        />
        {/* <EventLog /> */}
      </div>
    </FluentProvider>
  );
}

export default App;
