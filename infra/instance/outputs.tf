output "api_app_service_url" {
  description = "The URL of the API App Service"
  value       = module.api.api_app_service_url
}

output "cloudbeaver_app_service_url" {
  description = "The URL of the CloudBeaver App Service"
  value       = local.cloudbeaver_count == 1 ? module.cloudbeaver[0].cloudbeaver_app_service_url : null
  sensitive   = true
}

output "database_host" {
  description = "The FQDN of the PostgreSQL server."
  value       = local.database_host
  sensitive   = true
}

output "database_name" {
  description = "The name of the PostgreSQL database."
  value       = local.database_name
  sensitive   = true
}
