# -----------------------------------------
# AppService Module Terraform Configuration
# -----------------------------------------

# App Service Plan
resource "azurerm_service_plan" "appservice" {
  name                = "${var.app_name}-${var.module_name}-asp"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = var.app_service_sku_name
  tags                = var.common_tags

  lifecycle {
    ignore_changes = [tags]
  }
}

# API Autoscaler
resource "azurerm_monitor_autoscale_setting" "api_autoscale" {
  name                = "${var.app_name}-${var.module_name}-autoscale"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.common_tags
  target_resource_id  = azurerm_service_plan.appservice.id

  # This does not work if the SKU is not Premium
  enabled = var.enable_api_autoscale
  profile {
    name = "default"
    capacity {
      default = 2
      minimum = 1
      maximum = 10
    }
    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.appservice.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 70
      }
      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT1M"
      }
    }
    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.appservice.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 30
      }
      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT1M"
      }
    }
  }

  depends_on = [azurerm_service_plan.appservice]
}
