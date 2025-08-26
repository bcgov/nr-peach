# ----------------------------------------
# Migration Module Terraform Configuration
# ----------------------------------------

# Create database
resource "azurerm_postgresql_flexible_server_database" "postgres_database" {
  name      = var.database_name
  server_id = var.database_id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Container Instance for Migration
resource "azurerm_container_group" "migration" {
  name                = "${var.app_name}-migration"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_ids          = [var.container_instance_subnet_id]
  priority            = "Regular"
  dns_config {
    nameservers = var.dns_servers
  }
  diagnostics {
    log_analytics {
      workspace_id  = var.log_analytics_workspace_id
      workspace_key = var.log_analytics_workspace_key
    }
  }
  container {
    name     = "migration"
    image    = "${var.container_registry_url}/${var.container_image}"
    cpu      = "0.1"
    memory   = "0.2"
    commands = ["/bin/sh", "-c", "kysely migrate latest && kysely seed run"]
    environment_variables = {
      FORCE_REDEPLOY = local.force_redeploy
      PGDATABASE     = var.database_name
      PGHOST         = var.database_host
      PGUSER         = var.database_admin_username
      PGPASSWORD     = var.database_admin_password
      PGSSLMODE      = var.database_ssl_mode
    }
  }
  ip_address_type = "None"
  os_type         = "Linux"
  restart_policy  = "OnFailure" # DNS resolution is nondeterministic so we need to keep trying until it works
  tags            = var.common_tags
  lifecycle {
    ignore_changes = [tags, ip_address_type]
  }

  depends_on = [azurerm_postgresql_flexible_server_database.postgres_database]
}

# Verify migration completion and handle exit codes
resource "null_resource" "verify_migration" {
  provisioner "local-exec" {
    command = "sh ${path.module}/verify_migration.sh '${var.resource_group_name}' '${azurerm_container_group.migration.name}' migration"
  }
  triggers = {
    container_group_id = azurerm_container_group.migration.id
  }

  depends_on = [azurerm_container_group.migration]
}
