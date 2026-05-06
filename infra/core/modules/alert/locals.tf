locals {
  # If SKU starts with 'GP', use 859. Otherwise, use 50.
  db_conn_limit               = substr(var.postgresql_sku_name, 0, 2) == "GP" ? 859 : 50
  db_conn_threshold           = ceil(local.db_conn_limit * 0.8) # Set to ~80% of the SKU's max connections
  default_auto_mitigate       = true                            # Automatically resolve alerts and avoid flapping
  default_common_alert_schema = true                            # Sends both Fired and Resolved alerts
  default_frequency           = "PT1M"                          # 1 minute
  default_window_size         = "PT5M"                          # 5 minutes
  enable_frontdoor            = var.frontdoor_profile_id != null && var.frontdoor_profile_id != ""
  role_id                     = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635" # "Owner" Entra role for ARM role-based alerting
}
