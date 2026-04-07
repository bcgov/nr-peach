locals {
  postgres_configurations = {
    "log_connections"            = "off" # Remove connection logging
    "log_disconnections"         = "off" # Remove disconnection logging
    "log_duration"               = "off" # Remove duration logging (logs every single statement's time)
    "log_min_duration_statement" = "500" # Set slow query threshold (500ms)
    "log_statement"              = "DDL" # Set log_statement (keeping default DDL)
    "track_io_timing"            = "off" # Remove IO timing
  }
}
