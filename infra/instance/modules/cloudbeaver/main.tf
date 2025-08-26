# ------------------------------------------
# Cloudbeaver Module Terraform Configuration
# ------------------------------------------

resource "random_string" "cloudbeaver_admin_name" {
  length  = 12
  special = false
  upper   = false
  numeric = true
}

resource "random_password" "cloudbeaver_admin_password" {
  length  = 16
  special = true
}

# Create the cloudbeaver resource group
resource "azurerm_resource_group" "main" {
  name     = "${var.resource_group_name}-${var.module_name}-rg"
  location = var.location
  tags     = var.common_tags
  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

# CloudBeaver Storage Account (optional)
resource "azurerm_storage_account" "cloudbeaver" {
  name                            = "${replace(var.app_name, "-", "")}cbstorage"
  resource_group_name             = azurerm_resource_group.main.name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  public_network_access_enabled   = false
  allow_nested_items_to_be_public = false
  tags                            = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }
}

resource "azurerm_storage_share" "cloudbeaver_workspace" {
  name               = "${var.app_name}-cb-workspace"
  storage_account_id = azurerm_storage_account.cloudbeaver.id
  quota              = 10

  depends_on = [azurerm_storage_account.cloudbeaver]
}

resource "azurerm_private_endpoint" "cloudbeaver_storage" {
  name                = "${var.app_name}-cb-storage-pe"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = var.private_endpoints_subnet_id
  private_service_connection {
    name                           = "${var.app_name}-cb-storage-psc"
    private_connection_resource_id = azurerm_storage_account.cloudbeaver.id
    subresource_names              = ["file"]
    is_manual_connection           = false
  }
  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags, private_dns_zone_group]
  }

  depends_on = [azurerm_storage_account.cloudbeaver]
}

resource "azurerm_linux_web_app" "cloudbeaver" {
  name                      = "${var.repo_name}-${var.app_env}-${var.module_name}-app"
  resource_group_name       = azurerm_resource_group.main.name
  location                  = var.location
  service_plan_id           = var.app_service_plan_id
  virtual_network_subnet_id = var.api_subnet_id
  https_only                = true
  identity {
    type         = "UserAssigned"
    identity_ids = [var.user_assigned_identity_id]
  }
  site_config {
    always_on                                     = true
    container_registry_use_managed_identity       = true
    container_registry_managed_identity_client_id = var.user_assigned_identity_client_id
    minimum_tls_version                           = "1.3"
    health_check_path                             = "/"
    health_check_eviction_time_in_min             = 10
    application_stack {
      docker_image_name   = var.container_image
      docker_registry_url = var.container_registry_url
    }
    ftps_state       = "Disabled"
    app_command_line = "/bin/sh -c 'mkdir -p /opt/cloudbeaver/workspace && echo \"CloudBeaver starting with persistent workspace...\" && /opt/cloudbeaver/run-server.sh'"
    # ip_restriction {
    #   name        = "DenyAll"
    #   action      = "Deny"
    #   priority    = 500
    #   ip_address  = "0.0.0.0/0"
    #   description = "Deny all other traffic"
    # }
  }
  app_settings = {
    APPINSIGHTS_INSTRUMENTATIONKEY        = var.appinsights_instrumentation_key
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.appinsights_connection_string
    AZURE_STORAGE_CONNECTION_STRING       = azurerm_storage_account.cloudbeaver.primary_connection_string
    CB_ADMIN_NAME                         = random_string.cloudbeaver_admin_name.result
    CB_ADMIN_PASSWORD                     = random_password.cloudbeaver_admin_password.result
    CB_DEV_MODE                           = "false"
    CB_ENABLE_REVERSEPROXY_AUTH           = "false"
    CB_LOCAL_HOST_ACCESS                  = "false"
    CB_SERVER_NAME                        = var.app_name
    CB_SERVER_URL                         = "https://${var.app_name}-${var.app_env}-${var.module_name}-app.azurewebsites.net"
    DOCKER_ENABLE_CI                      = "true"
    PORT                                  = "8978"
    POSTGRES_DATABASE                     = var.database_name
    database_host                         = var.database_host
    POSTGRES_PASSWORD                     = var.database_admin_password
    POSTGRES_PORT                         = "5432"
    POSTGRES_USER                         = var.database_admin_username
    WEBSITES_ENABLE_APP_SERVICE_STORAGE   = "false"
    WEBSITES_PORT                         = "8978"
    WORKSPACE_PATH                        = "/opt/cloudbeaver/workspace"
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
