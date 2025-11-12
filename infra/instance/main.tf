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

data "azapi_resource" "container_instance_subnet" {
  type      = "Microsoft.Network/virtualNetworks/subnets@2024-07-01"
  name      = var.container_instance_subnet_name
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

data "azurerm_log_analytics_workspace" "main" {
  name                = "${var.app_name}-log-analytics-workspace"
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

# -----------------------------
# Modules based on Dependencies
# -----------------------------
module "migration" {
  source   = "./modules/migration"
  app_name = var.app_name

  container_image              = var.api_image
  container_instance_subnet_id = data.azapi_resource.container_instance_subnet.output.id
  database_admin_password      = var.database_admin_password
  database_admin_username      = var.database_admin_username
  database_host                = local.database_host
  database_id                  = data.azurerm_postgresql_flexible_server.postgresql.id
  database_name                = local.database_name
  dns_servers                  = data.azurerm_virtual_network.main.dns_servers
  enable_force_migration       = var.enable_force_migration
  location                     = var.location
  log_analytics_workspace_id   = data.azurerm_log_analytics_workspace.main.workspace_id
  log_analytics_workspace_key  = data.azurerm_log_analytics_workspace.main.primary_shared_key
  resource_group_name          = azurerm_resource_group.main.name

  depends_on = [azurerm_resource_group.main]
}

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

  depends_on = [module.migration]
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
}
