# -----------------------------------------
# AppService Module Terraform Configuration
# -----------------------------------------

# App Service Plan
resource "azurerm_service_plan" "appservice" {
  name                            = "${var.app_name}-${var.module_name}-asp"
  location                        = var.location
  resource_group_name             = var.resource_group_name
  maximum_elastic_worker_count    = var.enable_api_autoscale && startswith(var.app_service_sku_name, "P") ? 10 : null
  os_type                         = "Linux"
  premium_plan_auto_scale_enabled = var.enable_api_autoscale && startswith(var.app_service_sku_name, "P")
  sku_name                        = var.app_service_sku_name
  worker_count                    = var.enable_api_autoscale && startswith(var.app_service_sku_name, "P") ? 2 : 1
  zone_balancing_enabled          = var.enable_api_autoscale && startswith(var.app_service_sku_name, "P")
  tags                            = var.common_tags

  lifecycle {
    ignore_changes = [tags]
  }
}

# Rules Based API Autoscaler
resource "azurerm_monitor_autoscale_setting" "api_autoscale" {
  count = 0
  # count               = var.enable_api_autoscale && startswith(var.app_service_sku_name, "P") ? 1 : 0
  name                = "${var.app_name}-${var.module_name}-autoscale"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.common_tags
  target_resource_id  = azurerm_service_plan.appservice.id

  # The App Service Plan must be Premium tier to enable Autoscaling
  enabled = var.enable_api_autoscale && startswith(var.app_service_sku_name, "P")
  profile {
    name = "default"
    capacity {
      default = 2
      minimum = 2
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
