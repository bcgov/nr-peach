# -----------------------------------------
# Alerts Module Terraform Configuration
# -----------------------------------------

# Alert Action Group for email notifications
resource "azurerm_monitor_action_group" "action_group" {
  name                = "${var.app_name}-${var.module_name}-ag"
  resource_group_name = var.resource_group_name
  short_name          = "peach${var.module_name}"

  arm_role_receiver {
    name                    = "alertowners"
    role_id                 = local.role_id
    use_common_alert_schema = local.default_common_alert_schema
  }

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }
}

# Front Door origin health alert (if Front Door is enabled)
resource "azurerm_monitor_metric_alert" "fd_origin_health" {
  count               = local.enable_frontdoor ? 1 : 0
  name                = "${var.app_name}-${var.module_name}-fd-origin-unhealthy"
  resource_group_name = var.resource_group_name
  scopes              = [var.frontdoor_profile_id]
  description         = "Front Door cannot reach the backend App Service."
  auto_mitigate       = local.default_auto_mitigate
  frequency           = local.default_frequency
  severity            = 1
  window_size         = local.default_window_size

  criteria {
    metric_namespace = "Microsoft.Cdn/profiles"
    metric_name      = "BackendHealthPercentage"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 100
  }

  action {
    action_group_id = azurerm_monitor_action_group.action_group.id
  }

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }

  depends_on = [azurerm_monitor_action_group.action_group]
}

# Database high CPU alert
resource "azurerm_monitor_metric_alert" "db_cpu_high" {
  name                = "${var.app_name}-${var.module_name}-db-cpu-high"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgres_server_id]
  description         = "Postgres CPU high. Check for expensive queries."
  severity            = 2

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 90
  }

  action {
    action_group_id = azurerm_monitor_action_group.action_group.id
  }

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }

  depends_on = [azurerm_monitor_action_group.action_group]
}

# Database high connections alert
resource "azurerm_monitor_metric_alert" "db_connections_high" {
  name                = "${var.app_name}-${var.module_name}-db-connections-high"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgres_server_id]
  description         = "Postgres active connections approaching limit. Check for pool leaks."
  severity            = 2

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "active_connections"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80 # Set to ~80% of your SKU's max connections
  }

  action {
    action_group_id = azurerm_monitor_action_group.action_group.id
  }

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }

  depends_on = [azurerm_monitor_action_group.action_group]
}
