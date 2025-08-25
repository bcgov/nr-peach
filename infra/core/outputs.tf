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
