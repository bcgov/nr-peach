output "api_app_service_url" {
  description = "The URL of the API App Service"
  value       = module.api.api_app_service_url
}

output "database_host" {
  description = "The FQDN of the PostgreSQL server."
  value       = data.azurerm_postgresql_flexible_server.postgresql.fqdn
}

output "database_name" {
  description = "The name of the PostgreSQL database."
  value       = local.database_name
}
