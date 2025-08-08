output "database_host" {
  description = "The FQDN of the PostgreSQL server."
  value       = azurerm_postgresql_flexible_server.postgresql.fqdn
}

output "database_ip" {
  description = "The private endpoint IP address of the PostgreSQL server."
  value       = azurerm_private_endpoint.postgresql.private_service_connection[0].private_ip_address
}

output "database_name" {
  description = "The name of the PostgreSQL database."
  value       = azurerm_postgresql_flexible_server_database.postgres_database.name
}
