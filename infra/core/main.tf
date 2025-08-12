# ---------------------------------------
# Root Level Core Terraform Configuration
# ---------------------------------------

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

# User Assigned Managed Identity
resource "azurerm_user_assigned_identity" "app_service_identity" {
  name                = "${var.app_name}-as-identity"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = var.common_tags

  depends_on = [azurerm_resource_group.main]
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
  vnet_address_space       = var.vnet_address_space
  vnet_name                = var.vnet_name
  vnet_resource_group_name = var.vnet_resource_group_name

  depends_on = [azurerm_resource_group.main]
}

module "appservice" {
  source = "./modules/appservice"

  app_name              = var.app_name
  app_service_sku_name  = var.app_service_sku_name
  api_autoscale_enabled = var.api_autoscale_enabled
  common_tags           = var.common_tags
  location              = var.location
  resource_group_name   = azurerm_resource_group.main.name

  depends_on = [module.network]
}

module "postgresql" {
  source = "./modules/postgresql"

  app_name                     = var.app_name
  auto_grow_enabled            = var.postgres_auto_grow_enabled
  backup_retention_period      = var.postgres_backup_retention_period
  common_tags                  = var.common_tags
  db_master_password           = var.db_master_password
  geo_redundant_backup_enabled = var.postgres_geo_redundant_backup_enabled
  ha_enabled                   = var.postgres_ha_enabled
  location                     = var.location
  postgres_version             = var.postgres_version
  postgresql_admin_username    = var.postgresql_admin_username
  postgresql_sku_name          = var.postgres_sku_name
  postgresql_storage_mb        = var.postgres_storage_mb
  private_endpoint_subnet_id   = module.network.private_endpoint_subnet_id
  resource_group_name          = azurerm_resource_group.main.name
  standby_availability_zone    = var.postgres_standby_availability_zone
  zone                         = var.postgres_zone

  depends_on = [module.network]
}
