variable "app_name" {
  description = "Name of the application."
  type        = string
  nullable    = false
}

variable "container_app_environment_id" {
  description = "The resource id for the container app environment."
  type        = string
  nullable    = false
}

variable "common_tags" {
  description = "Common tags to apply to all resources."
  type        = map(string)
  nullable    = false
}

variable "frontdoor_firewall_policy_id" {
  description = "The resource id for the Front Door firewall policy."
  type        = string
  nullable    = true
  default     = null
}

variable "frontdoor_profile_id" {
  description = "The resource id for the Front Door profile."
  type        = string
  nullable    = false
}

variable "health_probe_path" {
  description = "Health probe path for origin group."
  type        = string
  nullable    = false
  default     = "/ready"
}

variable "instance_name" {
  description = "Name of the instance."
  type        = string
  nullable    = false
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  nullable    = false
}

variable "origin_host_header" {
  description = "Host header sent to origin. Usually same as origin_host_name."
  type        = string
  nullable    = true
  default     = null
}

variable "origin_host_name" {
  description = "Origin hostname Front Door connects to (e.g., Container App ingress FQDN)."
  type        = string
  nullable    = false
}

variable "sample_size" {
  description = "Sample size amount for front door origin group load balancing probing."
  type        = number
  default     = 4
}

variable "successful_samples_required" {
  description = "Successful samples needed for front door origin group load balancing probing."
  type        = number
  default     = 3
}
