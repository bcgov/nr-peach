output "api_app_service_url" {
  description = "The URL of the API App Service"
  value       = module.api.api_app_service_url
}

output "cloudbeaver_app_service_url" {
  description = "The URL of the CloudBeaver App Service"
  value       = var.enable_cloudbeaver ? module.cloudbeaver[0].cloudbeaver_app_service_url : null
}

output "database_host" {
  description = "The FQDN of the PostgreSQL server."
  value       = data.azurerm_postgresql_flexible_server.postgresql.fqdn
}

output "database_name" {
  description = "The name of the PostgreSQL database."
  value       = local.database_name
}
