# -------------------------------------------
# Root Level Instance Terraform Configuration
# -------------------------------------------

# Core Root Resources
data "azurerm_resource_group" "core" {
  name = "${var.resource_group_name}-core-rg"
}

# Core App Service
data "azurerm_service_plan" "api" {
  name                = "${var.app_name}-appservice-asp"
  resource_group_name = data.azurerm_resource_group.core.name
}

# Core Front Door Profile
data "azurerm_cdn_frontdoor_profile" "frontdoor" {
  count               = local.enable_frontdoor ? 1 : 0
  name                = "${var.app_name}-frontdoor"
  resource_group_name = data.azurerm_resource_group.core.name
}

data "azurerm_cdn_frontdoor_firewall_policy" "frontdoor_firewall_policy" {
  count               = local.enable_frontdoor ? 1 : 0
  name                = "${replace(var.app_name, "/[^a-zA-Z0-9]/", "")}${var.app_env}frontdoorfirewall"
  resource_group_name = data.azurerm_resource_group.core.name
}

# Core Log Analytics
data "azurerm_log_analytics_workspace" "monitoring" {
  name                = "${var.app_name}-log-analytics-workspace"
  resource_group_name = data.azurerm_resource_group.core.name
}

# Core Monitoring
data "azurerm_application_insights" "monitoring" {
  name                = "${var.app_name}-appinsights"
  resource_group_name = data.azurerm_resource_group.core.name
}

# Core Networking
data "azurerm_virtual_network" "main" {
  name                = var.vnet_name
  resource_group_name = var.vnet_resource_group_name
}

data "azapi_resource" "app_service_subnet" {
  type      = "Microsoft.Network/virtualNetworks/subnets@2024-07-01"
  name      = var.app_service_subnet_name
  parent_id = data.azurerm_virtual_network.main.id
}

# Core Postgresql
data "azurerm_postgresql_flexible_server" "postgresql" {
  name                = "${var.app_name}-${var.app_env}-postgresql"
  resource_group_name = "${var.resource_group_name}-core-rg"
}

# Create the main resource group
resource "azurerm_resource_group" "main" {
  name     = "${var.resource_group_name}-${var.instance_name}-rg"
  location = var.location

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }
}

# Create database
resource "azurerm_postgresql_flexible_server_database" "postgres_database" {
  name      = local.database_name
  server_id = data.azurerm_postgresql_flexible_server.postgresql.id
  collation = "en_US.utf8"
  charset   = "utf8"

  lifecycle {
    prevent_destroy = false
  }
}

# -----------------------------
# Modules based on Dependencies
# -----------------------------
module "api" {
  source = "./modules/api"

  api_frontdoor_resource_guid     = data.azurerm_cdn_frontdoor_profile.frontdoor[0].resource_guid
  app_env                         = var.app_env
  app_name                        = var.app_name
  app_service_plan_id             = data.azurerm_service_plan.api.id
  appinsights_connection_string   = data.azurerm_application_insights.monitoring.connection_string
  appinsights_instrumentation_key = data.azurerm_application_insights.monitoring.instrumentation_key
  api_subnet_id                   = data.azapi_resource.app_service_subnet.output.id
  auth_audience                   = var.auth_audience
  auth_issuer                     = var.auth_issuer
  auth_mode                       = var.auth_mode
  common_tags                     = var.common_tags
  container_image                 = var.api_image
  database_admin_password         = var.database_admin_password
  database_admin_username         = var.database_admin_username
  database_host                   = local.database_host
  database_name                   = local.database_name
  enable_frontdoor                = local.enable_frontdoor
  frontdoor_firewall_policy_id    = try(data.azurerm_cdn_frontdoor_firewall_policy.frontdoor_firewall_policy[0].id, null)
  frontdoor_profile_id            = data.azurerm_cdn_frontdoor_profile.frontdoor[0].id
  instance_name                   = var.instance_name
  log_analytics_workspace_id      = data.azurerm_log_analytics_workspace.monitoring.id
  location                        = var.location
  resource_group_name             = azurerm_resource_group.main.name

  depends_on = [azurerm_postgresql_flexible_server_database.postgres_database]
}
