# -------------------------------------------
# Root Level Instance Terraform Configuration
# -------------------------------------------

# Core Root Resources
data "azurerm_resource_group" "core" {
  name = "${var.resource_group_name}-core-rg"
}

data "azurerm_user_assigned_identity" "app_service_identity" {
  name                = "${var.app_name}-as-identity"
  resource_group_name = data.azurerm_resource_group.core.name
}

# Core App Service
data "azurerm_service_plan" "api" {
  name                = "${var.app_name}-appservice-asp"
  resource_group_name = data.azurerm_resource_group.core.name
}

# Core Container Apps Environment
data "azurerm_container_app_environment" "main" {
  name                = "${var.app_name}-${var.app_env}-containerenv"
  resource_group_name = data.azurerm_resource_group.core.name
}

# Core Front Door Profile
data "azurerm_cdn_frontdoor_profile" "frontdoor" {
  name                = "${var.app_name}-frontdoor"
  resource_group_name = data.azurerm_resource_group.core.name
}

data "azurerm_cdn_frontdoor_firewall_policy" "frontdoor_firewall_policy" {
  count               = local.frontdoor_firewall_policy_count
  name                = var.frontdoor_firewall_policy_name
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

data "azapi_resource" "privateendpoints_subnet" {
  type      = "Microsoft.Network/virtualNetworks/subnets@2024-07-01"
  name      = var.private_endpoints_subnet_name
  parent_id = data.azurerm_virtual_network.main.id
}

# Core Monitoring
data "azurerm_application_insights" "main" {
  name                = "${var.app_name}-appinsights"
  resource_group_name = data.azurerm_resource_group.core.name
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
  tags     = var.common_tags
  lifecycle {
    ignore_changes = [
      tags
    ]
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

  container_image                  = var.api_image
  app_env                          = var.app_env
  app_service_plan_id              = data.azurerm_service_plan.api.id
  appinsights_connection_string    = data.azurerm_application_insights.main.connection_string
  appinsights_instrumentation_key  = data.azurerm_application_insights.main.instrumentation_key
  api_subnet_id                    = data.azapi_resource.app_service_subnet.output.id
  common_tags                      = var.common_tags
  database_admin_password          = var.database_admin_password
  database_admin_username          = var.database_admin_username
  database_host                    = local.database_host
  database_name                    = local.database_name
  instance_name                    = var.instance_name
  location                         = var.location
  repo_name                        = var.repo_name
  resource_group_name              = azurerm_resource_group.main.name
  user_assigned_identity_client_id = data.azurerm_user_assigned_identity.app_service_identity.client_id
  user_assigned_identity_id        = data.azurerm_user_assigned_identity.app_service_identity.id

  depends_on = [azurerm_postgresql_flexible_server_database.postgres_database]
}

module "api_containerapp" {
  source = "./modules/api-containerapp"

  app_env                         = var.app_env
  appinsights_connection_string   = data.azurerm_application_insights.main.connection_string
  appinsights_instrumentation_key = data.azurerm_application_insights.main.instrumentation_key
  resource_group_name             = azurerm_resource_group.main.name
  common_tags                     = var.common_tags
  container_app_environment_id    = data.azurerm_container_app_environment.main.id
  container_image                 = var.api_image
  database_host                   = local.database_host
  database_name                   = local.database_name
  database_admin_username         = var.database_admin_username
  database_admin_password         = var.database_admin_password
  instance_name                   = var.instance_name
  repo_name                       = var.repo_name

  depends_on = [azurerm_postgresql_flexible_server_database.postgres_database]
}

module "api_frontdoor" {
  source = "./modules/api-frontdoor"

  app_name                     = var.app_name
  instance_name                = var.instance_name
  common_tags                  = var.common_tags
  frontdoor_profile_id         = data.azurerm_cdn_frontdoor_profile.frontdoor.id
  frontdoor_firewall_policy_id = local.frontdoor_firewall_policy_id
  container_app_environment_id = data.azurerm_container_app_environment.main.id
  origin_host_name             = module.api_containerapp.api_container_app_fqdn
  health_probe_path            = "/ready"
  location                     = var.location
}

module "cloudbeaver" {
  count  = local.cloudbeaver_count
  source = "./modules/cloudbeaver"

  app_env                          = var.app_env
  app_name                         = var.app_name
  app_service_plan_id              = data.azurerm_service_plan.api.id
  appinsights_connection_string    = data.azurerm_application_insights.main.connection_string
  appinsights_instrumentation_key  = data.azurerm_application_insights.main.instrumentation_key
  api_subnet_id                    = data.azapi_resource.app_service_subnet.output.id
  common_tags                      = var.common_tags
  database_admin_password          = var.database_admin_password
  database_admin_username          = var.database_admin_username
  database_host                    = local.database_host
  database_name                    = local.database_name
  location                         = var.location
  private_endpoints_subnet_id      = data.azapi_resource.privateendpoints_subnet.output.id
  repo_name                        = var.repo_name
  resource_group_name              = var.resource_group_name
  user_assigned_identity_client_id = data.azurerm_user_assigned_identity.app_service_identity.client_id
  user_assigned_identity_id        = data.azurerm_user_assigned_identity.app_service_identity.id

  depends_on = [azurerm_postgresql_flexible_server_database.postgres_database]
}
