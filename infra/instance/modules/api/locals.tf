locals {
  default_auto_mitigate = true   # Automatically resolve alerts and avoid flapping
  default_frequency     = "PT1M" # 1 minute
  default_window_size   = "PT5M" # 5 minutes
}
