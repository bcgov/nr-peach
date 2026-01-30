# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                           = "${var.app_name}-${var.app_env}-containerenv"
  location                       = var.location
  resource_group_name            = var.resource_group_name
  log_analytics_workspace_id     = var.log_analytics_workspace_id
  infrastructure_subnet_id       = var.container_apps_subnet_id
  public_network_access          = "Disabled"
  internal_load_balancer_enabled = true
  # Consumption workload profile (serverless)
  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
  }

  tags = var.common_tags

  lifecycle {
    ignore_changes = [tags]
  }
  logs_destination = "log-analytics"
}

# -----------------------------------------------------------------------------
# Fix Log Analytics Configuration
# -----------------------------------------------------------------------------
# The azurerm_container_app_environment resource doesn't properly set the
# Log Analytics shared key. Use azapi to patch the configuration.
resource "azapi_update_resource" "container_app_env_logs" {
  type        = "Microsoft.App/managedEnvironments@2024-03-01"
  resource_id = azurerm_container_app_environment.main.id

  body = {
    properties = {
      appLogsConfiguration = {
        destination = "log-analytics"
        logAnalyticsConfiguration = {
          customerId = var.log_analytics_workspace_customer_id
          sharedKey  = var.log_analytics_workspace_key
        }
      }
    }
  }

  depends_on = [azurerm_container_app_environment.main]
}

# Private Endpoint for Container Apps Environment
# Note: DNS zone association will be automatically managed by Azure Policy
resource "azurerm_private_endpoint" "containerapps" {
  name                = "${var.app_name}-containerapps-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id
  depends_on          = [azapi_update_resource.container_app_env_logs]

  private_service_connection {
    name                           = "${var.app_name}-containerapps-psc"
    private_connection_resource_id = azurerm_container_app_environment.main.id
    subresource_names              = ["managedEnvironments"]
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
}

# Don't think we'll need... Wait for Private Endpoint DNS zone association to complete
# resource "null_resource" "wait_for_containerapps_private_dns_zone" {
#   triggers = {
#     resource_group_name   = var.resource_group_name
#     private_endpoint_id   = azurerm_private_endpoint.containerapps.id
#     private_endpoint_name = azurerm_private_endpoint.containerapps.name
#   }

#   provisioner "local-exec" {
#     interpreter = ["bash", "-lc"]
#     command     = <<-EOT
#       set -euo pipefail

#       # Terraform may be run from repo root OR from infra/. Support both.
#       if [[ -f "./scripts/wait-for-dns-zone.sh" ]]; then
#         SCRIPT_PATH="./scripts/wait-for-dns-zone.sh"
#       elif [[ -f "./infra/scripts/wait-for-dns-zone.sh" ]]; then
#         SCRIPT_PATH="./infra/scripts/wait-for-dns-zone.sh"
#       else
#         echo "wait-for-dns-zone.sh not found. Expected ./scripts/wait-for-dns-zone.sh (from infra/) or ./infra/scripts/wait-for-dns-zone.sh (from repo root)." >&2
#         exit 2
#       fi

#       bash "$SCRIPT_PATH" \
#         --resource-group "${var.resource_group_name}" \
#         --private-endpoint-name "${azurerm_private_endpoint.containerapps.name}" \
#         --timeout "10m" \
#         --interval "10s"
#     EOT
#   }

#   depends_on = [azurerm_private_endpoint.containerapps]
# }

# resource "azurerm_monitor_diagnostic_setting" "container_app_env_diagnostics" {
#   name                       = "${var.app_name}-ca-env-diagnostics"
#   target_resource_id         = azurerm_container_app_environment.main.id
#   log_analytics_workspace_id = var.log_analytics_workspace_id

#   enabled_log { category = "ContainerAppConsoleLogs" }
#   enabled_log { category = "ContainerAppSystemLogs" }
#   enabled_metric { category = "AllMetrics" }
# }
