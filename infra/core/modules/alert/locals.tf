locals {
  default_auto_mitigate       = true   # Automatically resolve alerts and avoid flapping
  default_common_alert_schema = true   # Sends both Fired and Resolved alerts
  default_frequency           = "PT1M" # 1 minute
  default_window_size         = "PT5M" # 5 minutes
  enable_frontdoor            = var.frontdoor_profile_id != null && var.frontdoor_profile_id != ""
  role_id                     = "8e3af657-a8ff-443c-a75c-2fe8c4bcb635" # "Owner" role for ARM role-based alerting
}
