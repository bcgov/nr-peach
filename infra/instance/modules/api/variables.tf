variable "api_frontdoor_resource_guid" {
  description = "The resource GUID of the Front Door profile for the API."
  type        = string
  nullable    = true
  default     = null
}

variable "api_subnet_id" {
  description = "The subnet ID for the API App Service."
  type        = string
  nullable    = false
}

variable "app_automigrate" {
  description = "Automatically run migrations on startup."
  type        = string
  nullable    = true
  default     = "true"
}

variable "app_env" {
  description = "The deployment environment (e.g., dev, test, prod)."
  type        = string
  nullable    = false

  validation {
    condition     = contains(["dev", "test", "prod"], var.app_env)
    error_message = "app_env must be dev, test or prod."
  }
}

variable "app_name" {
  description = "Name of the application."
  type        = string
  nullable    = false
}

variable "app_service_plan_id" {
  description = "Azure App Service Plan ID"
  type        = string
  nullable    = false
}

variable "appinsights_connection_string" {
  description = "The Application Insights connection string for monitoring."
  type        = string
  nullable    = false
}

variable "appinsights_instrumentation_key" {
  description = "The Application Insights instrumentation key."
  type        = string
  nullable    = false
}

variable "auth_audience" {
  description = "The audience for OIDC JWT tokens."
  type        = string
  default     = "nr-peach"
}

variable "auth_issuer" {
  description = "The issuer of OIDC JWT tokens. Required if AUTH_MODE is authn or authz."
  type        = string
  nullable    = false
}

variable "auth_mode" {
  description = "Set the server auth mode. Options: (none, authn, authz)."
  type        = string
  nullable    = false
  default     = "authz"

  validation {
    condition     = contains(["none", "authn", "authz"], var.auth_mode)
    error_message = "auth_mode must be none, authn or authz."
  }
}

variable "common_tags" {
  description = "A map of tags to apply to resources."
  type        = map(string)
  default     = {}
}

variable "container_image" {
  description = "The Docker image for the api."
  type        = string
  nullable    = false
}

variable "container_registry_url" {
  description = "The URL of the container registry to pull images from."
  type        = string
  nullable    = false
  default     = "https://ghcr.io"
}

variable "database_admin_password" {
  description = "The password for the PostgreSQL admin user."
  type        = string
  sensitive   = true
  nullable    = false
}

variable "database_admin_username" {
  description = "The admin username for the PostgreSQL server."
  type        = string
  nullable    = false
}

variable "database_host" {
  description = "The FQDN of the PostgreSQL server."
  type        = string
  nullable    = false
}

variable "database_name" {
  description = "The name of the PostgreSQL database."
  type        = string
  nullable    = false
}

variable "database_ssl_mode" {
  description = "The SSL mode for the PostgreSQL connection (e.g., 'require', 'disable')."
  type        = string
  default     = "require"
}

variable "enable_frontdoor" {
  description = "Whether Front Door is enabled. When false, API is exposed directly via its default hostname."
  type        = bool
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
  nullable    = true
  default     = null
}


variable "health_probe_path" {
  description = "Health probe path for origin group."
  type        = string
  nullable    = false
  default     = "/ready"
}

variable "instance_name" {
  description = "Name of the instance"
  type        = string
  nullable    = false
}

variable "location" {
  description = "The Azure region where resources will be created."
  type        = string
  nullable    = false
}

variable "log_analytics_workspace_id" {
  description = "The resource ID of the Log Analytics workspace for diagnostics."
  type        = string
  nullable    = false
}

variable "module_name" {
  description = "Name of the module"
  type        = string
  default     = "api"
}

variable "node_env" {
  description = "The Node.js environment (e.g., production, development)."
  type        = string
  default     = "production"
}

variable "resource_group_name" {
  description = "The name of the resource group in which to create resources."
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
