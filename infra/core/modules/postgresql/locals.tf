locals {
  postgres_configurations = {
    "azure.extensions"           = "pg_stat_statements" # Allow-list only, run CREATE EXTENSION manually per database
    "log_connections"            = "off"                # Remove connection logging
    "log_disconnections"         = "off"                # Remove disconnection logging
    "log_duration"               = "off"                # Remove duration logging (logs every single statement's time)
    "log_min_duration_statement" = "500"                # Set slow query threshold (500ms)
    "log_statement"              = "DDL"                # Set log_statement (keeping default DDL)
    "pg_stat_statements.track"   = "ALL"                # Track top-level and nested statements
    "track_io_timing"            = "off"                # Remove IO timing
  }
}
