# ----------------------------------
# API Module Terraform Configuration
# ----------------------------------

resource "azurerm_linux_web_app" "api" {
  name                      = "${var.repo_name}-${var.app_env}-${var.instance_name}-${var.module_name}"
  resource_group_name       = var.resource_group_name
  location                  = var.location
  service_plan_id           = var.app_service_plan_id
  https_only                = true
  virtual_network_subnet_id = var.api_subnet_id
  identity {
    type = "SystemAssigned"
  }
  site_config {
    always_on                         = true
    health_check_path                 = "/ready"
    health_check_eviction_time_in_min = 2
    minimum_tls_version               = "1.3"
    application_stack {
      docker_image_name   = var.container_image
      docker_registry_url = var.container_registry_url
    }
    # cors {
    #   allowed_origins     = ["*"]
    #   support_credentials = false
    # }
    # ip_restriction {
    #   name        = "DenyAll"
    #   action      = "Deny"
    #   priority    = 500
    #   ip_address  = "0.0.0.0/0"
    #   description = "Deny all other traffic"
    # }
  }
  app_settings = {
    APP_AUTOMIGRATE                       = var.app_automigrate
    APPINSIGHTS_INSTRUMENTATIONKEY        = var.appinsights_instrumentation_key
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.appinsights_connection_string
    AUTH_AUDIENCE                         = var.auth_audience
    AUTH_ISSUER                           = var.auth_issuer
    AUTH_MODE                             = var.auth_mode
    NODE_ENV                              = var.node_env
    PGDATABASE                            = var.database_name
    PGHOST                                = var.database_host
    PGPASSWORD                            = var.database_admin_password
    PGSSLMODE                             = var.database_ssl_mode
    PGUSER                                = var.database_admin_username
    PORT                                  = "80"
    WEBSITE_ENABLE_SYNC_UPDATE_SITE       = "1"
    WEBSITE_SKIP_RUNNING_KUDUAGENT        = "false"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE   = "false"
    WEBSITES_PORT                         = "3000"
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
    ignore_changes = [tags]
  }
}
