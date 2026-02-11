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

variable "frontdoor_firewall_mode" {
  description = "Front Door firewall mode. Detection = log; Prevention = log + block."
  type        = string
  default     = "Prevention"
  nullable    = false

  validation {
    condition     = contains(["Detection", "Prevention"], var.frontdoor_firewall_mode)
    error_message = "frontdoor_firewall_mode must be Detection or Prevention."
  }
}

variable "frontdoor_sku_name" {
  description = "SKU name for Front Door (env override). Premium tier required for Private Links."
  type        = string
  default     = "Standard_AzureFrontDoor"
  nullable    = false

  validation {
    condition     = contains(["Standard_AzureFrontDoor", "Premium_AzureFrontDoor"], var.frontdoor_sku_name)
    error_message = "frontdoor_sku_name must be Standard_AzureFrontDoor or Premium_AzureFrontDoor."
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
