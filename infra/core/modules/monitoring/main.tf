# -----------------------------------------
# Monitoring Module Terraform Configuration
# -----------------------------------------

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.app_name}-log-analytics-workspace"
  location            = var.location
  resource_group_name = var.resource_group_name
  retention_in_days   = var.log_analytics_retention_days
  sku                 = var.log_analytics_sku
  tags                = var.common_tags

  lifecycle {
    ignore_changes = [
      # Ignore tags to allow management via Azure Policy
      tags
    ]
  }
}

# Application Insights for enhanced monitoring and logging
resource "azurerm_application_insights" "main" {
  name                = "${var.app_name}-appinsights"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "other"
  tags                = var.common_tags
  workspace_id        = azurerm_log_analytics_workspace.main.id

  lifecycle {
    ignore_changes = [
      # Ignore tags to allow management via Azure Policy
      tags
    ]
  }
}
