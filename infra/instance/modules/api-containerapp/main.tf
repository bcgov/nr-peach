# ----------------------------------
# API Module Terraform Configuration
# ----------------------------------

resource "azurerm_container_app" "api" {
  name                         = "${var.repo_name}-${var.app_env}-${var.instance_name}-${var.module_name}"
  container_app_environment_id = var.container_app_environment_id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  workload_profile_name        = "Consumption"

  identity {
    type = var.enable_system_assigned_identity ? "SystemAssigned" : "None"
  }

  secret {
    name  = "pgpassword"
    value = var.database_admin_password
  }

  secret {
    name  = "appinsights-connection-string"
    value = var.appinsights_connection_string
  }

  secret {
    name  = "appinsights-instrumentation-key"
    value = var.appinsights_instrumentation_key
  }

  template {
    max_replicas                     = var.max_replicas
    min_replicas                     = var.min_replicas
    termination_grace_period_seconds = 10

    // TODO: Investigate init_container

    container {
      name   = "api"
      image  = var.container_image
      cpu    = var.container_cpu
      memory = var.container_memory

      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "APP_AUTOMIGRATE"
        value = var.app_automigrate
      }
      env {
        name  = "NODE_ENV"
        value = var.node_env
      }
      env {
        name  = "PGDATABASE"
        value = var.database_name
      }
      env {
        name  = "PGHOST"
        value = var.database_host
      }
      env {
        name  = "PGUSER"
        value = var.database_admin_username
      }
      env {
        name  = "PGSSLMODE"
        value = var.database_ssl_mode
      }
      env {
        name        = "PGPASSWORD"
        secret_name = "pgpassword"
      }
      env {
        name  = "APPINSIGHTS_INSTRUMENTATIONKEY"
        value = var.appinsights_instrumentation_key
      }
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = var.appinsights_connection_string
      }

      startup_probe {
        transport = "HTTP"
        path      = "/ready"
        port      = 3000
        timeout   = 5
      }
      readiness_probe {
        transport               = "HTTP"
        path                    = "/ready"
        port                    = 3000
        timeout                 = 5
        failure_count_threshold = 3
      }
      liveness_probe {
        transport               = "HTTP"
        path                    = "/live"
        port                    = 3000
        timeout                 = 5
        failure_count_threshold = 3
      }
    }
    http_scale_rule {
      name                = "http-scaling"
      concurrent_requests = "20" # TODO: What do we want? Try changing in load testing
    }
  }

  ingress {
    # Ingress enabled so Front Door (via Private Link) can reach the app.
    # NOTE: This does not make the app internet-public because the ACA Environment is private
    # Front Door remains the only public entry point.
    external_enabled = true
    target_port      = 3000
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }

    allow_insecure_connections = false
  }

  tags = var.common_tags

  lifecycle {
    ignore_changes = [tags]
  }
}
