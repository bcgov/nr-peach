# -----------------------------------------
# Alerts Module Terraform Configuration
# -----------------------------------------

# Alert Action Group for email notifications
resource "azurerm_monitor_action_group" "action_group" {
  name                = "${var.app_name}-${var.module_name}-ag"
  resource_group_name = var.resource_group_name
  short_name          = "peach${var.module_name}"

  dynamic "email_receiver" {
    for_each = {
      for index, email in var.alert_emails : index => email
    }
    content {
      name                    = format("email-%02d", tonumber(email_receiver.key) + 1)
      email_address           = email_receiver.value
      use_common_alert_schema = local.default_common_alert_schema
    }
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
  severity            = 0
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
