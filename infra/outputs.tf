# output "app_service_url" {
#   description = "The URL of the App Service"
#   value       = "https://${azurerm_linux_web_app.api.default_hostname}"
# }

# output "application_insights_connection_string" {
#   description = "Application Insights connection string"
#   value       = azurerm_application_insights.main.connection_string
#   sensitive   = true
# }

# output "application_insights_instrumentation_key" {
#   description = "Application Insights instrumentation key"
#   value       = azurerm_application_insights.main.instrumentation_key
#   sensitive   = true
# }

# output "cloudbeaver_app_service_url" {
#   description = "The URL of the CloudBeaver App Service"
#   value       = var.enable_psql_sidecar ? "https://${azurerm_linux_web_app.psql_sidecar[0].default_hostname}" : null
# }

# output "database_endpoint" {
#   description = "Full endpoint for the database including port"
#   value       = "${azurerm_postgresql_flexible_server.main.fqdn}:5432"
#   sensitive   = false
# }

# output "database_name" {
#   description = "Name of the created database"
#   value       = azurerm_postgresql_flexible_server_database.main.name
# }

# # output "frontend_app_service_url" {
# #   description = "The URL of the Frontend App Service"
# #   value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
# # }

# output "ha_enabled" {
#   description = "Whether high availability is enabled"
#   value       = var.ha_enabled
# }

# output "log_analytics_workspace_id" {
#   description = "ID of the Log Analytics Workspace"
#   value       = azurerm_log_analytics_workspace.main.id
# }

# output "log_analytics_workspace_name" {
#   description = "Name of the Log Analytics Workspace"
#   value       = azurerm_log_analytics_workspace.main.name
# }

# output "postgresql_admin_username" {
#   description = "Administrator username for PostgreSQL server"
#   value       = var.postgresql_admin_username
#   sensitive   = true
# }

# output "postgresql_connection_string" {
#   description = "Connection string for PostgreSQL database (without credentials)"
#   value       = "postgresql://${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}"
#   sensitive   = false
# }

# output "postgresql_jdbc_connection_string" {
#   description = "JDBC Connection string for PostgreSQL database (without credentials)"
#   value       = "jdbc:postgresql://${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
#   sensitive   = false
# }

# output "postgresql_private_endpoint_id" {
#   description = "ID of the PostgreSQL private endpoint"
#   value       = azurerm_private_endpoint.postgresql.id
# }

# output "postgresql_private_endpoint_ip" {
#   description = "Private IP address of the PostgreSQL private endpoint"
#   value       = azurerm_private_endpoint.postgresql.private_service_connection[0].private_ip_address
# }

# output "postgresql_server_fqdn" {
#   description = "Fully qualified domain name of the PostgreSQL server"
#   value       = azurerm_postgresql_flexible_server.main.fqdn
# }

# output "postgresql_server_name" {
#   description = "Name of the PostgreSQL server"
#   value       = azurerm_postgresql_flexible_server.main.name
# }

# output "resource_group_name" {
#   description = "Name of the created resource group"
#   value       = azurerm_resource_group.main.name
# }

# output "user_assigned_identity_id" {
#   description = "ID of the User Assigned Managed Identity"
#   value       = azurerm_user_assigned_identity.container_apps.id
# }

# output "user_assigned_identity_principal_id" {
#   description = "Principal ID of the User Assigned Managed Identity"
#   value       = azurerm_user_assigned_identity.container_apps.principal_id
# }

# output "application_gateway_fqdn" {
#   description = "FQDN of the Application Gateway public IP"
#   value       = azurerm_public_ip.app_gateway.fqdn
# }

# output "application_gateway_public_ip" {
#   description = "Public IP address of the Application Gateway"
#   value       = azurerm_public_ip.app_gateway.ip_address
# }

# output "application_gateway_url" {
#   description = "URL of the Application Gateway"
#   value       = azurerm_public_ip.app_gateway.fqdn != null ? "https://${azurerm_public_ip.app_gateway.fqdn}" : "https://${azurerm_public_ip.app_gateway.ip_address}"
# }
