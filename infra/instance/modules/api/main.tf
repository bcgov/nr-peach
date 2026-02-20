# ----------------------------------
# API Module Terraform Configuration
# ----------------------------------

resource "azurerm_linux_web_app" "api" {
  name                      = "${var.app_name}-${var.app_env}-${var.instance_name}-${var.module_name}"
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
    health_check_path                 = var.health_probe_path
    health_check_eviction_time_in_min = 2
    ip_restriction_default_action     = var.enable_frontdoor ? "Deny" : "Allow"
    minimum_tls_version               = "1.3"
    application_stack {
      docker_image_name   = var.container_image
      docker_registry_url = var.container_registry_url
    }
    dynamic "ip_restriction" {
      for_each = var.enable_frontdoor ? [1] : []
      content {
        name        = "AllowFrontDoor"
        action      = "Allow"
        priority    = 100
        service_tag = "AzureFrontDoor.Backend"
        headers {
          x_azure_fdid = [var.api_frontdoor_resource_guid]
        }
      }
    }
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

resource "azurerm_monitor_diagnostic_setting" "api_diagnostics" {
  name                       = "${var.app_name}-${var.app_env}-${var.instance_name}-${var.module_name}-diagnostics"
  target_resource_id         = azurerm_linux_web_app.api.id
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
  enabled_metric {
    category = "allMetrics"
  }

  depends_on = [azurerm_linux_web_app.api]
}

# Front Door Endpoint
# Creates the Front Door endpoint (the *.azurefd.net domain). Routes attach here.
resource "azurerm_cdn_frontdoor_endpoint" "api_fd_endpoint" {
  count                    = var.enable_frontdoor ? 1 : 0
  name                     = "${var.app_name}-${var.app_env}-${var.instance_name}-${var.module_name}-fd"
  cdn_frontdoor_profile_id = var.frontdoor_profile_id

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }
}

# Front Door Origin Group
# Groups one or more origins and defines how Front Door probes them and decides
# whether they're healthy. Even with a single origin, this is required by AFD.
resource "azurerm_cdn_frontdoor_origin_group" "api_fd_origin_group" {
  count                    = var.enable_frontdoor ? 1 : 0
  name                     = "${var.app_name}-${var.app_env}-${var.instance_name}-${var.module_name}-fd-og"
  cdn_frontdoor_profile_id = var.frontdoor_profile_id

  load_balancing {
    sample_size                 = var.sample_size
    successful_samples_required = var.successful_samples_required
  }
  health_probe {
    interval_in_seconds = 120
    path                = var.health_probe_path
    protocol            = "Https"
    request_type        = "GET"
  }
}

# Front Door Origin
resource "azurerm_cdn_frontdoor_origin" "api_fd_origin" {
  count                         = var.enable_frontdoor ? 1 : 0
  name                          = "${var.app_name}-${var.app_env}-${var.instance_name}-${var.module_name}-fd-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api_fd_origin_group[0].id

  certificate_name_check_enabled = true
  enabled                        = true
  host_name                      = azurerm_linux_web_app.api.default_hostname
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = azurerm_linux_web_app.api.default_hostname

  depends_on = [azurerm_cdn_frontdoor_origin_group.api_fd_origin_group[0]]
}

# Front Door Route
resource "azurerm_cdn_frontdoor_route" "api_fd_route" {
  count                         = var.enable_frontdoor ? 1 : 0
  name                          = "${var.app_name}-${var.app_env}-${var.instance_name}-${var.module_name}-fd-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.api_fd_endpoint[0].id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api_fd_origin_group[0].id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.api_fd_origin[0].id]

  supported_protocols    = ["Http", "Https"]
  patterns_to_match      = ["/*"]
  forwarding_protocol    = "HttpsOnly"
  link_to_default_domain = true
  https_redirect_enabled = true

  depends_on = [
    azurerm_cdn_frontdoor_endpoint.api_fd_endpoint[0],
    azurerm_cdn_frontdoor_origin.api_fd_origin[0]
  ]
}

# Front Door Security Policy
# Associates the firewall policy to the Front Door endpoint domain and path patterns.
resource "azurerm_cdn_frontdoor_security_policy" "api_fd_security_policy" {
  count                    = var.enable_frontdoor ? 1 : 0
  name                     = "${var.app_name}-${var.app_env}-${var.instance_name}-${var.module_name}-fd-security-policy"
  cdn_frontdoor_profile_id = var.frontdoor_profile_id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = var.frontdoor_firewall_policy_id

      association {
        patterns_to_match = ["/*"]
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.api_fd_endpoint[0].id
        }
      }
    }
  }

  depends_on = [azurerm_cdn_frontdoor_endpoint.api_fd_endpoint[0]]
}
