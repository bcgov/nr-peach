output "database_host" {
  description = "The FQDN of the PostgreSQL server."
  value       = module.postgresql.database_host
}

output "database_ip" {
  description = "The private endpoint IP address of the PostgreSQL server."
  value       = module.postgresql.database_ip
}
