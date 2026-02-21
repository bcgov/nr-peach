# -----------------------------------------
# Monitoring Module Terraform Configuration
# -----------------------------------------

moved {
  from = azurerm_log_analytics_workspace.main
  to   = azurerm_log_analytics_workspace.log_analytics_workspace
}

moved {
  from = azurerm_application_insights.main
  to   = azurerm_application_insights.appinsights
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "log_analytics_workspace" {
  name                = "${var.app_name}-log-analytics-workspace"
  location            = var.location
  resource_group_name = var.resource_group_name
  retention_in_days   = var.log_analytics_retention_days
  sku                 = var.log_analytics_sku

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }
}

# Application Insights for enhanced monitoring and logging
resource "azurerm_application_insights" "appinsights" {
  name                = "${var.app_name}-appinsights"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "other"
  workspace_id        = azurerm_log_analytics_workspace.log_analytics_workspace.id

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }

  depends_on = [azurerm_log_analytics_workspace.log_analytics_workspace]
}
