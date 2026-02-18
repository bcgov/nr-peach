# -----------------------------------------
# Chisel Module Terraform Configuration
# -----------------------------------------

resource "random_password" "chisel_password" {
  length  = 16
  special = true
}

resource "azurerm_linux_web_app" "chisel" {
  name                      = "${var.repo_name}-${var.app_env}-chisel"
  resource_group_name       = var.resource_group_name
  location                  = var.location
  https_only                = true
  service_plan_id           = var.app_service_plan_id
  virtual_network_subnet_id = var.app_service_subnet_id
  identity {
    type = "SystemAssigned"
  }
  site_config {
    app_command_line              = "server --reverse"
    ftps_state                    = "Disabled"
    ip_restriction_default_action = "Allow"
    minimum_tls_version           = "1.3"
    websockets_enabled            = true
    application_stack {
      docker_image_name   = var.container_image
      docker_registry_url = var.container_registry_url
    }
  }
  app_settings = {
    APPINSIGHTS_INSTRUMENTATIONKEY        = var.appinsights_instrumentation_key
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.appinsights_connection_string
    AUTH                                  = "tunnel:${random_password.chisel_password.result}"
    PORT                                  = "80"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE   = "false"
    WEBSITES_PORT                         = "80"
  }
  logs {
    detailed_error_messages = true
    failed_request_tracing  = true
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 100
      }
    }
  }

  tags = var.common_tags
  lifecycle {
    ignore_changes = [
      tags,
      enabled # Don't start web app if status is disabled
    ]
  }
}

resource "azurerm_monitor_diagnostic_setting" "chisel_diagnostics" {
  name                       = "${var.app_name}-chisel-diagnostics"
  target_resource_id         = azurerm_linux_web_app.chisel.id
  log_analytics_workspace_id = var.log_analytics_workspace_id
  enabled_log {
    category = "AppServiceHTTPLogs"
  }
  enabled_log {
    category = "AppServiceConsoleLogs"
  }
  enabled_log {
    category = "AppServiceAppLogs"
  }
  enabled_log {
    category = "AppServicePlatformLogs"
  }

  depends_on = [azurerm_linux_web_app.chisel]
}
