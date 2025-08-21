# -----------------------------------------
# PostgreSQL Module Terraform Configuration
# -----------------------------------------

resource "random_password" "postgres_master_password" {
  length  = 16
  special = true
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "postgresql" {
  name                = "${var.app_name}-${var.module_name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.common_tags

  administrator_login    = var.postgresql_admin_username
  administrator_password = random_password.postgres_master_password.result

  sku_name                     = var.postgresql_sku_name
  version                      = var.postgres_version
  zone                         = var.zone
  storage_mb                   = var.postgresql_storage_mb
  backup_retention_days        = var.backup_retention_period
  geo_redundant_backup_enabled = var.enable_geo_redundant_backup

  # Not allowed to be public in Azure Landing Zone
  # Public network access is disabled to comply with Azure Landing Zone security requirements
  public_network_access_enabled = false

  # High availability configuration
  dynamic "high_availability" {
    for_each = var.enable_ha ? [1] : []
    content {
      mode                      = "ZoneRedundant"
      standby_availability_zone = var.standby_availability_zone
    }
  }

  # Auto-scaling configuration
  auto_grow_enabled = var.enable_auto_grow

  # Lifecycle block to handle automatic DNS zone associations by Azure Policy
  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

# Private Endpoint for PostgreSQL Flexible Server
# Private DNS Zone association is automatically managed by Azure Landing Zone Policy
# The Landing Zone automation will automatically associate the private endpoint
# with the appropriate managed DNS zone (privatelink.postgres.database.azure.com)
resource "azurerm_private_endpoint" "postgresql" {
  name                = "${var.app_name}-${var.module_name}-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id
  tags                = var.common_tags

  private_service_connection {
    name                           = "${var.app_name}-postgresql-psc"
    private_connection_resource_id = azurerm_postgresql_flexible_server.postgresql.id
    subresource_names              = ["postgresqlServer"]
    is_manual_connection           = false
  }

  # Lifecycle block to ignore DNS zone group changes managed by Azure Policy
  lifecycle {
    ignore_changes = [
      private_dns_zone_group,
      tags
    ]
  }

  depends_on = [azurerm_postgresql_flexible_server.postgresql]
}

# Wait for PostgreSQL to be ready before configuring
resource "time_sleep" "wait_for_postgresql" {
  create_duration = "1m"

  depends_on = [azurerm_postgresql_flexible_server.postgresql]
}

resource "azurerm_postgresql_flexible_server_configuration" "log_statement" {
  name      = "log_statement"
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  value     = "all"

  depends_on = [time_sleep.wait_for_postgresql]
}

# PostgreSQL Configuration for performance - the server must be fully operational first
resource "azurerm_postgresql_flexible_server_configuration" "shared_preload_libraries" {
  name      = "shared_preload_libraries"
  server_id = azurerm_postgresql_flexible_server.postgresql.id
  value     = "pg_stat_statements"

  depends_on = [azurerm_postgresql_flexible_server_configuration.log_statement]
}

# Wait for Private Endpoint to be ready before exiting module - can take 10 minutes before the IP address is available
# Ref: https://developer.gov.bc.ca/docs/default/component/public-cloud-techdocs/azure/best-practices/be-mindful/#private-endpoints-and-dns
resource "time_sleep" "wait_for_private_endpoint" {
  create_duration = "10m"

  depends_on = [
    azurerm_postgresql_flexible_server_configuration.shared_preload_libraries,
    azurerm_private_endpoint.postgresql
  ]
}
