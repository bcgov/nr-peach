variable "app_automigrate" {
  description = "The deployment environment (e.g., dev, test, prod)."
  type        = string
  nullable    = true
  default     = "true"
}

variable "app_env" {
  description = "The deployment environment (e.g., dev, test, prod)."
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

variable "common_tags" {
  description = "A map of tags to apply to resources."
  type        = map(string)
  default     = {}
}

variable "container_app_environment_id" {
  description = "The resource id for the container app environment."
  type        = string
  nullable    = false
}

variable "container_cpu" {
  description = "CPU allocation for api container app (in cores)."
  type        = number
  default     = 0.5
  nullable    = false
}

variable "container_memory" {
  description = "Memory allocation for api container app."
  type        = string
  default     = "1Gi"
  nullable    = false
}

variable "container_image" {
  description = "The Docker image for the api."
  type        = string
  nullable    = false
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

variable "enable_system_assigned_identity" {
  description = "Enable system assigned managed identity"
  type        = bool
  default     = true
  nullable    = false
}

variable "instance_name" {
  description = "Name of the instance"
  type        = string
  nullable    = false
}

variable "max_replicas" {
  description = "Maximum number of replicas for backend"
  type        = number
  default     = 10 # Higher max for Consumption workload
  nullable    = false
}

variable "min_replicas" {
  description = "Minimum number of replicas for backend"
  type        = number
  default     = 0 # Allow scale to zero for Consumption workload
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

variable "repo_name" {
  description = "The repository name, used for resource naming."
  type        = string
  nullable    = false
}

variable "resource_group_name" {
  description = "The name of the resource group in which to create resources."
  type        = string
  nullable    = false
}
