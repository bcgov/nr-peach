# ----------------------------------------
# Migration Module Terraform Configuration
# ----------------------------------------

# Create the main resource group for all migration resources
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

# Container Instance for Migration
resource "azurerm_container_group" "migration" {
  name                = "${var.app_name}-migration"
  location            = var.location
  resource_group_name = "${var.resource_group_name}-${var.module_name}-rg"
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
      FORCE_REDEPLOY = null_resource.trigger_migration.id
      PGDATABASE     = var.database_name
      PGHOST         = var.postgres_host
      PGUSER         = var.postgresql_admin_username
      PGPASSWORD     = var.db_master_password
      PGSSLMODE      = var.db_ssl_mode
    }
  }
  ip_address_type = "None"
  os_type         = "Linux"
  restart_policy  = "Never"
  tags            = var.common_tags
  lifecycle {
    ignore_changes       = [tags, ip_address_type]
    replace_triggered_by = [null_resource.trigger_migration]
  }

  depends_on = [azurerm_resource_group.main]
}

# Ensure that the migration container runs on every apply
resource "null_resource" "trigger_migration" {
  triggers = {
    always_run = timestamp()
  }

  depends_on = [azurerm_resource_group.main]
}

# Verify migration completion and handle exit codes
resource "null_resource" "verify_migration" {
  provisioner "local-exec" {
    command = "sh ${path.module}/verify_migration.sh '${azurerm_container_group.migration.resource_group_name}' '${azurerm_container_group.migration.name}' migration"
  }

  depends_on = [azurerm_container_group.migration]
}
