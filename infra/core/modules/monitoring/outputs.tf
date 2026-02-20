output "appinsights_connection_string" {
  description = "The Application Insights connection string."
  value       = azurerm_application_insights.appinsights.connection_string
  sensitive   = true
}

output "appinsights_instrumentation_key" {
  description = "The Application Insights instrumentation key."
  value       = azurerm_application_insights.appinsights.instrumentation_key
  sensitive   = true
}

output "log_analytics_workspace_id" {
  description = "The resource ID of the Log Analytics workspace."
  value       = azurerm_log_analytics_workspace.log_analytics_workspace.id
  sensitive   = true
}

output "log_analytics_workspace_key" {
  description = "The primary shared key for the Log Analytics workspace."
  value       = azurerm_log_analytics_workspace.log_analytics_workspace.primary_shared_key
  sensitive   = true
}

output "log_analytics_workspace_workspaceId" {
  description = "The name of the Log Analytics workspace."
  value       = azurerm_log_analytics_workspace.log_analytics_workspace.workspace_id
  sensitive   = true
}
