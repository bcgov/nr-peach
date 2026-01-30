variable "app_name" {
  description = "Name of the application."
  type        = string
  nullable    = false
}

variable "common_tags" {
  description = "Common tags to apply to all resources."
  type        = map(string)
  nullable    = false
}

variable "enable_frontdoor_firewall" {
  description = "Whether to create + attach a Firewall policy."
  type        = bool
  nullable    = false
  default     = true
}

variable "frontdoor_firewall_mode" {
  description = "Firewall mode, detection = log, prevention = log + block"
  type        = string
  default     = "Prevention" # Detection | Prevention
}

variable "frontdoor_sku_name" {
  description = "Front Door SKU. Premium required for Private Link to private origins."
  type        = string
  nullable    = false

  validation {
    condition     = var.frontdoor_sku_name == "Premium_AzureFrontDoor"
    error_message = "frontdoor_sku_name must be Premium_AzureFrontDoor for this deployment."
  }
}

variable "rate_limit_duration_in_minutes" {
  description = "Firewall rate limit duration."
  type        = number
  nullable    = false
  default     = 1
}

variable "rate_limit_threshold" {
  description = "Firewall rate limit threshold."
  type        = number
  nullable    = false
  default     = 100
}

variable "resource_group_name" {
  description = "The name of the resource group to create."
  type        = string
  nullable    = false
}
