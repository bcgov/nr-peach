locals {
  default_auto_mitigate       = true   # Automatically resolve alerts and avoid flapping
  default_common_alert_schema = true   # Sends both Fired and Resolved alerts
  default_frequency           = "PT1M" # 1 minute
  default_window_size         = "PT5M" # 5 minutes
  enable_alerts               = length(var.alert_emails) > 0
  enable_frontdoor            = local.enable_alerts && var.frontdoor_profile_id != null && var.frontdoor_profile_id != ""
}
