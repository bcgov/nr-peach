locals {
  frontdoor_security_policy_count = var.frontdoor_firewall_policy_id != null ? 1 : 0
}
