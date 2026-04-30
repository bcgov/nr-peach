variable "alert_emails" {
  description = "Email recipients for application alert notifications."
  type        = list(string)
  default     = ["jeremy.ho@gov.bc.ca"]
}

variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "frontdoor_profile_id" {
  description = "Front Door profile id for monitoring scope."
  type        = string
}

variable "module_name" {
  description = "Name of the module"
  type        = string
  default     = "alert"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}
