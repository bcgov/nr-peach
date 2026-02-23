# ---------------------------------------
# Root Level Core Terraform Configuration
# ---------------------------------------

# Create the main resource group
resource "azurerm_resource_group" "main" {
  name     = "${var.resource_group_name}-${var.lifecycle_name}-rg"
  location = var.location

  tags = var.common_tags
  lifecycle {
    ignore_changes = [tags]
  }
}

# -----------------------------
# Modules based on Dependencies
# -----------------------------
module "monitoring" {
  source = "./modules/monitoring"

  app_name                     = var.app_name
  common_tags                  = var.common_tags
  location                     = var.location
  log_analytics_retention_days = var.log_analytics_retention_days
  log_analytics_sku            = var.log_analytics_sku
  resource_group_name          = azurerm_resource_group.main.name

  depends_on = [azurerm_resource_group.main]
}

module "network" {
  source = "./modules/network"

  common_tags              = var.common_tags
  resource_group_name      = azurerm_resource_group.main.name
  vnet_name                = var.vnet_name
  vnet_resource_group_name = var.vnet_resource_group_name

  depends_on = [azurerm_resource_group.main]
}

module "appservice" {
  source = "./modules/appservice"

  app_name                   = var.app_name
  app_service_sku_name       = local.app_service_sku_name
  enable_api_autoscale       = local.enable_api_autoscale
  common_tags                = var.common_tags
  location                   = var.location
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
  resource_group_name        = azurerm_resource_group.main.name
  scale_out_method           = local.scale_out_method

  depends_on = [module.network]
}

module "frontdoor" {
  count  = local.enable_frontdoor ? 1 : 0
  source = "./modules/frontdoor"

  app_name                       = var.app_name
  app_env                        = var.app_env
  common_tags                    = var.common_tags
  frontdoor_firewall_mode        = var.frontdoor_firewall_mode
  frontdoor_sku_name             = var.frontdoor_sku_name
  log_analytics_workspace_id     = module.monitoring.log_analytics_workspace_id
  rate_limit_duration_in_minutes = var.rate_limit_duration_in_minutes
  rate_limit_threshold           = var.rate_limit_threshold
  resource_group_name            = azurerm_resource_group.main.name

  depends_on = [module.network]
}

module "postgresql" {
  source = "./modules/postgresql"

  app_name                    = var.app_name
  app_env                     = var.app_env
  enable_auto_grow            = var.enable_postgres_auto_grow
  backup_retention_period     = var.postgres_backup_retention_period
  common_tags                 = var.common_tags
  enable_geo_redundant_backup = var.enable_postgres_geo_redundant_backup
  enable_ha                   = var.enable_postgres_ha
  location                    = var.location
  log_analytics_workspace_id  = module.monitoring.log_analytics_workspace_id
  postgres_version            = var.postgresql_version
  postgresql_admin_username   = var.postgresql_admin_username
  postgresql_sku_name         = local.postgresql_sku_name
  postgresql_storage_mb       = var.postgresql_storage_mb
  private_endpoint_subnet_id  = module.network.private_endpoint_subnet_id
  resource_group_name         = azurerm_resource_group.main.name
  standby_availability_zone   = var.postgresql_standby_availability_zone
  zone                        = var.postgresql_zone

  depends_on = [module.network]
}

module "chisel" {
  source = "./modules/chisel"

  app_env                         = var.app_env
  app_name                        = var.app_name
  app_service_plan_id             = module.appservice.api_service_plan_id
  app_service_subnet_id           = module.network.app_service_subnet_id
  appinsights_connection_string   = module.monitoring.appinsights_connection_string
  appinsights_instrumentation_key = module.monitoring.appinsights_instrumentation_key
  common_tags                     = var.common_tags
  location                        = var.location
  log_analytics_workspace_id      = module.monitoring.log_analytics_workspace_id
  repo_name                       = var.repo_name
  resource_group_name             = azurerm_resource_group.main.name

  depends_on = [module.appservice]
}
