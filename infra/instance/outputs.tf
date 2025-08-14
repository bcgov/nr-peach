# output "api_app_service_url" {
#   description = "The URL of the API App Service"
#   value       = module.api.api_app_service_url
# }

# output "api_frontdoor_endpoint" {
#   description = "The API endpoint"
#   value       = module.api.api_frontdoor_endpoint
# }

# output "cloudbeaver_app_service_url" {
#   description = "The URL of the CloudBeaver App Service"
#   value       = var.enable_cloudbeaver != null ? module.api.cloudbeaver_app_service_url : null
# }

# output "cloudbeaver_frontdoor_endpoint" {
#   description = "The CloudBeaver endpoint"
#   value       = var.enable_cloudbeaver != null ? module.api.cloudbeaver_frontdoor_endpoint : null
# }

# output "database_host" {
#   description = "The FQDN of the PostgreSQL server."
#   value       = module.postgresql.database_host
# }

# output "database_ip" {
#   description = "The private endpoint IP address of the PostgreSQL server."
#   value       = module.postgresql.database_ip
# }

output "database_name" {
  description = "The name of the PostgreSQL database."
  value       = local.database_name
}
