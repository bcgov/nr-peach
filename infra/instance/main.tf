# -------------------------------------------
# Root Level Instance Terraform Configuration
# -------------------------------------------

# Fetch core infra data values
data "azurerm_resource_group" "core" {
  name = "${var.resource_group_name}-core-rg"
}

data "azurerm_postgresql_flexible_server" "postgresql" {
  name                = "${var.app_name}-postgresql"
  resource_group_name = "${var.resource_group_name}-core-rg"
}

data "azurerm_virtual_network" "main" {
  name                = var.vnet_name
  resource_group_name = var.vnet_resource_group_name
}

data "azapi_resource" "container_instance_subnet" {
  type      = "Microsoft.Network/virtualNetworks/subnets@2024-07-01"
  name      = var.container_instance_subnet_name
  parent_id = data.azurerm_virtual_network.main.id
}

data "azurerm_log_analytics_workspace" "main" {
  name                = "${var.app_name}-log-analytics-workspace"
  resource_group_name = data.azurerm_resource_group.core.name
}

# None of this works
# azurerm_private_endpoint.postgresql.private_service_connection[0].private_ip_address

# data "azapi_resource" "postgresql_pe" {
#   name      = "${var.app_name}-postgresql-pe"
#   parent_id = data.azurerm_resource_group.core.id
#   type      = "Microsoft.Network/privateEndpoints@2023-05-01"
# }

# data "azapi_resource" "pe_nic" {
#   type = "Microsoft.Network/networkInterfaces@2024-07-01"
#   name = "${var.app_name}-postgresql-pe.nic.9ed7c896-0849-470d-b4a8-0ab17c452e9e"
#   # resource_id = local.pe_nic_id
#   parent_id = data.azurerm_resource_group.core.id
# }

# output "private_endpoint_ip" {
#   value = data.azapi_resource.pe_nic.output
# }

# output "temp" {
#   value = data.azapi_resource.postgresql_pe.output.properties
# }

# Create the main resource group
resource "azurerm_resource_group" "main" {
  name     = "${var.resource_group_name}-${var.lifecycle_name}-rg"
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
  database_name                = local.database_name
  database_id                  = data.azurerm_postgresql_flexible_server.postgresql.id
  db_master_password           = var.db_master_password
  dns_servers                  = data.azurerm_virtual_network.main.dns_servers
  location                     = var.location
  log_analytics_workspace_id   = data.azurerm_log_analytics_workspace.main.workspace_id
  log_analytics_workspace_key  = data.azurerm_log_analytics_workspace.main.primary_shared_key
  postgres_host                = data.azurerm_postgresql_flexible_server.postgresql.fqdn
  postgresql_admin_username    = var.postgresql_admin_username
  resource_group_name          = azurerm_resource_group.main.name
}

# module "frontdoor" {
#   source = "./modules/frontdoor"

#   app_name            = var.app_name
#   common_tags         = var.common_tags
#   enable_cloudbeaver  = var.enable_cloudbeaver
#   frontdoor_sku_name  = var.frontdoor_sku_name
#   location            = var.location
#   resource_group_name = azurerm_resource_group.main.name

#   depends_on = [azurerm_resource_group.main]
# }

# module "api" {
#   source = "./modules/api"

#   # api_frontdoor_id                         = module.frontdoor.frontdoor_id
#   # api_frontdoor_resource_guid              = module.frontdoor.frontdoor_resource_guid
#   # api_frontdoor_firewall_policy_id         = module.frontdoor.api_firewall_policy_id
#   # cloudbeaver_frontdoor_firewall_policy_id = module.frontdoor.cloudbeaver_firewall_policy_id
#   api_image                = var.api_image
#   app_env                  = var.app_env
#   app_name                 = var.app_name
#   app_service_sku_name_api = var.app_service_sku_name_api
#   # app_service_subnet_id                   = module.network.app_service_subnet_id
#   appinsights_connection_string   = module.monitoring.appinsights_connection_string
#   appinsights_instrumentation_key = module.monitoring.appinsights_instrumentation_key
#   api_autoscale_enabled           = var.api_autoscale_enabled
#   api_subnet_id                   = module.network.app_service_subnet_id
#   common_tags                     = var.common_tags
#   database_name                   = local.database_name
#   db_master_password              = var.db_master_password
#   enable_cloudbeaver              = var.enable_cloudbeaver
#   # frontend_possible_outbound_ip_addresses = module.frontend.possible_outbound_ip_addresses
#   location                         = var.location
#   log_analytics_workspace_id       = module.monitoring.log_analytics_workspace_id
#   postgres_host                    = var.prefer_fqdn && !isempty(data.azurerm_postgresql_flexible_server.postgresql.fqdn) ? data.azurerm_postgresql_flexible_server.postgresql.fqdn : data.azurerm_private_endpoint.postgresql.private_service_connection[0].private_ip_address
#   postgresql_admin_username        = var.postgresql_admin_username
#   private_endpoint_subnet_id       = module.network.private_endpoint_subnet_id
#   repo_name                        = var.repo_name
#   resource_group_name              = azurerm_resource_group.main.name
#   user_assigned_identity_client_id = azurerm_user_assigned_identity.app_service_identity.client_id
#   user_assigned_identity_id        = azurerm_user_assigned_identity.app_service_identity.id

#   depends_on = [module.migration]
# }
