output "api_app_service_url" {
  description = "The URL of the API App Service"
  value       = module.api.api_app_service_url
}

output "api_container_app_id" {
  description = "ID of the API Container App"
  value       = module.api_containerapp.api_container_app_id
}

output "api_container_app_name" {
  description = "Name of the API Container App."
  value       = module.api_containerapp.api_container_app_name
}

output "api_container_app_fqdn" {
  description = "FQDN of the API Container App ingress."
  value       = module.api_containerapp.api_container_app_fqdn
  sensitive   = true
}

output "api_container_app_url" {
  description = "Base URL of the API Container App."
  value       = module.api_containerapp.api_container_app_url
  sensitive   = true
}

output "api_frontdoor_host_name" {
  description = "Public Front Door hostname for this instance API."
  value       = module.api_frontdoor.frontdoor_endpoint_host_name
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
