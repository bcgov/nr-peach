output "container_app_environment_id" {
  description = "ID of the Container Apps Environment"
  value       = module.containerapp.container_app_environment_id
}

output "container_app_environment_name" {
  description = "Name of the Container Apps Environment"
  value       = module.containerapp.container_app_environment_name
}

output "database_host" {
  description = "The FQDN of the PostgreSQL server."
  value       = module.postgresql.database_host
  sensitive   = true
}

output "database_ip" {
  description = "The private endpoint IP address of the PostgreSQL server."
  value       = module.postgresql.database_ip
  sensitive   = true
}

output "database_master_password" {
  description = "The password for the PostgreSQL admin user."
  value       = module.postgresql.database_master_password
  sensitive   = true
}

output "frontdoor_profile_id" {
  description = "Shared Front Door profile id."
  value       = module.frontdoor.frontdoor_profile_id
}

output "frontdoor_firewall_policy_id" {
  description = "Shared Front Door firewall policy id."
  value       = module.frontdoor.frontdoor_firewall_policy_id
}
