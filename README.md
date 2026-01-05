# Flow Documentation Generator

<p align="center">
  <img src="https://raw.githubusercontent.com/cyco77/pptb-flow-documentation-generator/main/icon/flow-documentation_small.png" alt="Flow Documentation Generator Logo" width="314" height="150">
</p>

<p align="center">
  A Power Platform Tool Box (PPTB) tool for viewing and documenting Power Automate Cloud Flows. This tool provides an intuitive interface to explore flow definitions, visualize them as interactive Mermaid diagrams, and export documentation in multiple formats.
</p>

## Screenshots

### Dark Theme

![Plugin Documentation Generator - Dark Theme](https://raw.githubusercontent.com/cyco77/pptb-flow-documentation-generator/main/screenshots/main_dark.png)

### Light Theme

![Plugin Documentation Generator - Light Theme](https://raw.githubusercontent.com/cyco77/pptb-flow-documentation-generator/main/screenshots/main_light.png)

## Features

### Core Capabilities

- 📋 **Flow List View** - View all Cloud Flows in your Dynamics 365 environment in a sortable table
  - Sortable columns with visual arrow indicators (ascending/descending)
  - Optimized column widths for better data visibility
  - Click any row to open details in a side drawer
- 🔍 **Advanced Filtering** - Real-time search by flow name and description
- 📈 **Interactive Mermaid Diagrams** - Visualize flow logic with auto-generated Mermaid flowcharts
- 🖼️ **Multiple View Modes**:
  - **Diagram View**: Interactive flowchart visualization with zoom controls
  - **Mermaid Code**: View and copy the raw Mermaid syntax (formatted with line breaks)
  - **JSON View**: Inspect the original flow definition data
- 🔍 **Advanced Zoom Controls**:
  - Zoom range from 50% to 1000%
  - Interactive slider for precise control
  - +/- buttons for quick adjustments
  - Mouse wheel zoom with Ctrl/Cmd modifier
  - Reset button to return to 100%
- 📤 **Multiple Export Formats**:
  - Export flow list as CSV file
  - Copy flow list to clipboard as CSV
  - Copy flow list as Markdown table with flow details
  - Export individual flow diagrams as SVG file
  - Copy individual flow diagrams as SVG to clipboard
- 🎨 **Modern Theme Support**:
  - Automatic light/dark theme switching based on PPTB settings
  - Fresh, modern color palette for light mode diagrams (Material Design)
  - Optimized dark mode styling
- 📢 **Visual Notifications** - Toast notifications for all operations
- 📝 **Event Logging** - Track all operations and API calls in real-time
- 🔄 **Real-time Updates** - Automatic refresh on connection changes

### Technical Stack

- ✅ React 18 with TypeScript
- ✅ Fluent UI React Components v9 for consistent Microsoft design
- ✅ Mermaid.js for diagram rendering
- ✅ Vite for fast development and optimized builds
- ✅ Power Platform Toolbox API integration
- ✅ Dataverse API for querying flow data
- ✅ Custom hooks for state management
- ✅ Centralized logging service
- ✅ Hot Module Replacement (HMR) for development

## Structure

```
pptb-flow-documentation-generator/
├── src/
│   ├── components/
│   │   ├── AssemblySteps.tsx      # (Legacy component)
│   │   ├── EventLog.tsx           # Real-time event log display
│   │   ├── Filter.tsx             # Text filtering for flow list
│   │   ├── FlowDetails.tsx        # Flow detail view with Mermaid diagram
│   │   ├── Overview.tsx           # Flow list table view
│   │   └── ToolBar.tsx            # Action buttons toolbar
│   ├── hooks/
│   │   ├── useConnection.ts       # Dataverse connection management
│   │   ├── useToolboxAPI.ts       # PPTB API integration
│   │   └── useToolboxEvents.ts    # PPTB event subscription
│   ├── mappers/
│   │   └── flowDefinitionMapper.ts  # Map API responses to flow models
│   ├── services/
│   │   ├── dataverseService.ts    # Dataverse API queries
│   │   └── loggerService.ts       # Centralized logging singleton
│   ├── types/
│   │   └── flowDefinition.ts      # Flow definition type definitions
│   ├── utils/
│   │   ├── exportUtils.ts         # Export and clipboard utilities
│   │   └── Flow2MermaidConverter.ts  # Convert flow JSON to Mermaid syntax
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styling
├── dist/                          # Build output
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Power Platform Toolbox installed

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd pptb-flow-documentation-generator
```

2. Install dependencies:

```bash
npm install
```

## Development

### Development Server

Start development server with HMR:

```bash
npm run dev
```

The tool will be available at `http://localhost:5173`

### Watch Mode

Build the tool in watch mode for continuous updates:

```bash
npm run watch
```

### Production Build

Build the optimized production version:

```bash
npm run build
```

The output will be in the `dist/` directory.

### Preview Build

Preview the production build locally:

```bash
npm run preview
```

## Usage

### In Power Platform Toolbox

1. Build the tool:

   ```bash
   npm run build
   ```

2. Package the tool (creates npm-shrinkwrap.json):

   ```bash
   npm run finalize-package
   ```

3. Install in Power Platform Toolbox using the PPTB interface

4. Connect to a Dataverse environment

5. Launch the tool to view and document your Cloud Flows

### User Interface

#### Flow List View

- **Searchable Table**: View all flows with sortable columns (Name, Description, State, Created On, Modified On)
  - Click column headers to sort
  - Visual arrow indicators show sort direction (ascending/descending)
  - Optimized column widths: Name (25%), Description (35%), State (10%), Dates (15% each)
- **Text Filter**: Real-time search across flow names and descriptions
- **Action Buttons**:
  - **Copy CSV**: Copy flow list to clipboard in CSV format
  - **Copy Markdown**: Copy flow list as a Markdown table with flow details
  - **Export CSV**: Download flow list as a CSV file
- **Flow Selection**: Click any row to open the detailed view in a side drawer (80% viewport width, max 1400px)

#### Flow Detail View (Drawer)

- **Flow Information**:
  - Flow name displayed in drawer header
  - State, Workflow ID, Created On, Modified On in fixed details section
- **View Mode Tabs** (combined with context-aware controls in single row):
  - **Diagram**: Interactive Mermaid flowchart with modern styling and zoom controls
  - **Mermaid Code**: View and copy the raw Mermaid syntax (formatted with line breaks after semicolons)
  - **JSON**: Inspect the complete flow definition
- **Context-Aware Controls**:
  - **Diagram View**: Zoom slider (50%-1000%), +/- buttons, reset button, Copy SVG button, Export SVG button
  - **Mermaid View**: Copy to Clipboard button
  - **JSON View**: Copy to Clipboard button
- **Mouse Wheel Zoom**: Hold Ctrl (Windows/Linux) or Cmd (Mac) and scroll to zoom in/out
- **Scrollable Content**: Only the diagram/code/JSON area scrolls, header and controls remain fixed

#### Event Log

- Monitor all operations and API calls
- Color-coded log levels (info, success, warning, error)
- Auto-scrolls to show latest entries

## API Usage

The tool demonstrates various Power Platform Toolbox and Dataverse API features:

### Connection Management

```typescript
// Get current connection
const connection = await window.toolboxAPI.getConnection();
console.log(connection.connectionUrl);

// Listen for connection changes
window.toolboxAPI.onToolboxEvent((event, payload) => {
  if (event === "connection:updated") {
    // Refresh data with new connection
  }
});
```

### Dataverse Queries

```typescript
// Query Cloud Flows (workflows)
const flows = await window.dataverseAPI.executeQuery(
  `workflows?$select=workflowid,name,description,createdon,modifiedon,statecode,clientdata&$filter=category eq 5`
);
```

### Notifications

```typescript
await window.toolboxAPI.utils.showNotification({
  title: "Export Successful",
  body: "Exported 15 plugin assembly steps",
  type: "success",
  duration: 3000,
});
```

### File Operations

```typescript
// Save CSV file
await window.toolboxAPI.utils.saveFile("flow_definitions.csv", csvContent);

// Save SVG diagram
await window.toolboxAPI.utils.saveFile("flow_diagram.svg", svgString);

// Copy to clipboard
await window.toolboxAPI.utils.copyToClipboard(content);
```

### Theme Management

```typescript
// Get current theme
const theme = await window.toolboxAPI.utils.getCurrentTheme();
// Returns 'light' or 'dark'

// Listen for theme changes
window.toolboxAPI.onToolboxEvent((event) => {
  if (event === "settings:updated") {
    updateThemeBasedOnSettings();
  }
});
```

### Event Subscription

```typescript
// Subscribe to all PPTB events
window.toolboxAPI.onToolboxEvent((event, payload) => {
  console.log("Event:", event);
  console.log("Data:", payload.data);

  // Handle specific events
  switch (event) {
    case "connection:created":
    case "connection:updated":
      refreshConnection();
      break;
    case "connection:deleted":
      clearData();
      break;
  }
});
```

## Architecture

### Custom Hooks

- **useConnection**: Manages Dataverse connection state and refresh logic
- **useToolboxAPI**: Provides PPTB API access with theme management
- **useToolboxEvents**: Subscribes to PPTB events and handles callbacks

### Services

- **loggerService**: Singleton service for centralized logging with callback pattern

  - Methods: `info()`, `success()`, `warning()`, `error()`
  - Eliminates prop drilling for logging across components

- **dataverseService**: Handles all Dataverse API queries
  - Queries Cloud Flow definitions (workflows)
  - Maps raw API responses to typed models

### Export Utilities

- **exportFlowDefinitionsToCSV**: Export flow list to CSV file
- **copyFlowDefinitionsAsCSV**: Copy flow list as CSV to clipboard
- **copyFlowDefinitionsAsMarkdown**: Copy flows as Markdown table format
- **handleExportSVG**: Export individual flow diagram as SVG file
- **handleCopySVG**: Copy individual flow diagram as SVG to clipboard

All export functions support optional notifications for user feedback and use the Power Platform Toolbox API for file operations and clipboard access.

### Flow Visualization

- **Flow2MermaidConverter**: Converts Power Automate flow JSON definitions to Mermaid flowchart syntax
  - Parses flow actions, triggers, and control structures
  - Generates clean, readable Mermaid diagrams
  - Supports branching, loops, and nested conditions

### Type Safety

Full TypeScript coverage with:

- Interface definitions for all data models
- Type-safe API responses
- Strongly typed component props
- PPTB API types from `@pptb/types` package

## Configuration

### Vite Build Configuration

The tool uses a custom Vite configuration for PPTB compatibility:

- **IIFE format**: Bundles as Immediately Invoked Function Expression for iframe compatibility
- **Single bundle**: Uses `inlineDynamicImports` to avoid module loading issues with file:// URLs
- **HTML transformation**: Custom plugin removes `type="module"` and moves scripts to end of body
- **Chunk size limit**: Set to 1000 kB to accommodate Fluent UI bundle size

## Data Models

### FLowDefinition

```typescript
{
  workflowid: string;
  name: string;
  description: string | null;
  createdon: Date;
  modifiedon: Date;
  statecode: number; // 0=Draft, 1=Active, 2=Inactive
  clientdata: string; // JSON string of flow definition
}
```

## Troubleshooting

### Build Issues

If you encounter chunk size warnings:

- The tool uses IIFE format which requires a single bundle
- Chunk size limit is configured in `vite.config.ts`
- This is expected for Fluent UI and Mermaid.js components

### Connection Issues

- Ensure you're connected to a Dataverse environment in PPTB
- Check the Event Log for connection-related errors
- Verify permissions to read workflow data

### Diagram Rendering Issues

- If diagrams don't appear, check browser console for Mermaid errors
- Try switching to another view mode and back to Diagram
- Verify the flow has valid `clientdata` in JSON format

### Theme Not Updating

- The tool automatically syncs with PPTB theme settings
- Check console for theme update events
- Verify PPTB version supports theme API

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with appropriate TypeScript types
4. Test the build process
5. Submit a pull request

### GitHub Actions

The project includes automated CI/CD workflows:

#### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches:

- **Build and Test**:

  - Tests on Node.js 18.x and 20.x
  - TypeScript type checking
  - Build verification
  - Uploads build artifacts

- **Lint Check**:

  - Runs ESLint if configured
  - Validates code quality

- **Security Audit**:

  - Checks for npm package vulnerabilities
  - Fails on critical vulnerabilities
  - Warns on high-severity issues

- **Package Validation**:
  - Validates package.json structure
  - Creates npm-shrinkwrap.json
  - Verifies all required fields

#### Release Workflow (`.github/workflows/release.yml`)

Triggered when pushing a version tag (e.g., `v1.0.0`):

- Builds the project
- Creates distribution packages (tar.gz and zip)
- Creates GitHub release with auto-generated notes
- Attaches build artifacts to release

**To create a release:**

```bash
# Update version in package.json
npm version patch  # or minor, major

# Push with tags
git push origin main --tags
```

## License

MIT - See LICENSE file for details

## Author

Lars Hildebrandt
