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

  # Autoscale properties
  maximum_elastic_worker_count    = local.scale_out_method == "Auto" ? var.max_instances : null
  premium_plan_auto_scale_enabled = local.scale_out_method == "Auto"
  worker_count                    = local.enable_autoscale ? 2 : 1
  zone_balancing_enabled          = local.enable_autoscale # worker_count requires 2 or more to enable

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }
}

# Rules Based API Autoscaler
resource "azurerm_monitor_autoscale_setting" "api_autoscale" {
  count               = local.scale_out_method == "Rules" ? 1 : 0
  name                = "${var.app_name}-${var.module_name}-autoscale"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.common_tags
  target_resource_id  = azurerm_service_plan.appservice.id

  # The App Service Plan must be Premium tier to enable Autoscaling
  enabled = local.enable_autoscale
  profile {
    name = "default"
    capacity {
      default = 2
      minimum = 2
      maximum = var.max_instances
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
