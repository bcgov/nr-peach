# -----------------------------------------
# PostgreSQL Module Terraform Configuration
# -----------------------------------------

# Create the main resource group for all postgresql resources
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

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "postgresql" {
  name                = "${var.app_name}-${var.module_name}"
  resource_group_name = "${var.resource_group_name}-${var.module_name}-rg"
  location            = var.location

  administrator_login    = var.postgresql_admin_username
  administrator_password = var.db_master_password

  sku_name                     = var.postgresql_sku_name
  version                      = var.postgres_version
  zone                         = var.zone
  storage_mb                   = var.postgresql_storage_mb
  backup_retention_days        = var.backup_retention_period
  geo_redundant_backup_enabled = var.geo_redundant_backup_enabled

  # Not allowed to be public in Azure Landing Zone
  # Public network access is disabled to comply with Azure Landing Zone security requirements
  public_network_access_enabled = false

  # High availability configuration
  dynamic "high_availability" {
    for_each = var.ha_enabled ? [1] : []
    content {
      mode                      = "ZoneRedundant"
      standby_availability_zone = var.standby_availability_zone
    }
  }

  # Auto-scaling configuration
  auto_grow_enabled = var.auto_grow_enabled
  tags              = var.common_tags

  # Lifecycle block to handle automatic DNS zone associations by Azure Policy
  lifecycle {
    ignore_changes = [
      tags
    ]
  }

  depends_on = [azurerm_resource_group.main]
}

# Create database
resource "azurerm_postgresql_flexible_server_database" "postgres_database" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  collation = "en_US.utf8"
  charset   = "utf8"

  depends_on = [azurerm_postgresql_flexible_server.postgresql]
}

# Note: PostgreSQL Flexible Server private endpoint is created above
# Private DNS Zone association is automatically managed by Azure Landing Zone Policy
# The Landing Zone automation will automatically associate the private endpoint
# with the appropriate managed DNS zone (privatelink.postgres.database.azure.com)

# Private Endpoint for PostgreSQL Flexible Server
# Note: DNS zone association will be automatically managed by Azure Policy
resource "azurerm_private_endpoint" "postgresql" {
  name                = "${var.app_name}-${var.module_name}-pe"
  location            = var.location
  resource_group_name = "${var.resource_group_name}-${var.module_name}-rg"
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.app_name}-postgresql-psc"
    private_connection_resource_id = azurerm_postgresql_flexible_server.postgresql.id
    subresource_names              = ["postgresqlServer"]
    is_manual_connection           = false
  }

  tags = var.common_tags

  # Lifecycle block to ignore DNS zone group changes managed by Azure Policy
  lifecycle {
    ignore_changes = [
      private_dns_zone_group,
      tags
    ]
  }

  depends_on = [azurerm_resource_group.main]
}

resource "time_sleep" "wait_for_postgresql" {
  create_duration = "20s"

  depends_on = [
    azurerm_postgresql_flexible_server_database.postgres_database,
    azurerm_private_endpoint.postgresql
  ]
}

resource "azurerm_postgresql_flexible_server_configuration" "log_statement" {
  name      = "log_statement"
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  value     = "all"

  depends_on = [time_sleep.wait_for_postgresql]
}

# PostgreSQL Configuration for performance
# These configurations require the server to be fully operational
resource "azurerm_postgresql_flexible_server_configuration" "shared_preload_libraries" {
  name      = "shared_preload_libraries"
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  value     = "pg_stat_statements"

  depends_on = [azurerm_postgresql_flexible_server_configuration.log_statement]
}
