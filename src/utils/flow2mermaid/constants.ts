export const actionTypeColors: Record<string, { bg: string; border: string }> = {
  Trigger: { bg: "#ffcccc", border: "#ff0000" },
  If: { bg: "#fff4cc", border: "#ff9900" },
  Switch: { bg: "#e6ccff", border: "#9900ff" },
  Foreach: { bg: "#ccffcc", border: "#00cc00" },
  Terminate: { bg: "#ffcccc", border: "#cc0000" },
  Default: { bg: "#cce5ff", border: "#0066cc" },
};

export const apiNameTranslations: Record<string, string> = {
  shared_commondataserviceforapps: "Dataverse",
  shared_commondataservice: "Dataverse (legacy)",
  shared_office365: "Office 365 Outlook",
  shared_office365users: "Office 365 Users",
  shared_sharepointonline: "SharePoint",
  shared_onedriveforbusiness: "OneDrive",
  shared_teams: "Microsoft Teams",
  shared_planner: "Planner",
  shared_excelonlinebusiness: "Excel Online",
  shared_forms: "Microsoft Forms",
  shared_powerbi: "Power BI",
  shared_powerapps: "Power Apps",
  shared_approvals: "Approvals",
  shared_sql: "SQL Server",
  shared_azureblob: "Azure Blob",
  shared_sftp: "SFTP",
  shared_http: "HTTP",
};

export const typeNameTranslations: Record<string, string> = {
  OpenApiConnection: "Standard connector action",
  OpenApiConnectionWebhook: "Webhook trigger",
  OpenApiConnectionNotification: "Polling trigger",
  OpenApiConnectionNotificationWithPolling: "Advanced polling trigger",
  ApiConnection: "Legacy connector action",
  ApiConnectionWebhook: "Legacy webhook trigger",
  Request: "HTTP request trigger",
  Manual: "Manual trigger",
  Recurrence: "Schedule trigger",
  Scope: "Logical grouping container",
  If: "Conditional block",
  Foreach: "Loop",
  Until: "Loop until condition",
};
