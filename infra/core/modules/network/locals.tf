# Calculate subnet CIDRs based on VNet address space
locals {
  # Split the address space
  # app_service_subnet_cidr        = "${local.base_ip}.0/27"
  # base_ip                        = "${local.octets[0]}.${local.octets[1]}.${local.octets[2]}"
  # container_apps_subnet_cidr     = "${local.base_ip}.64/27" # Note: ACA minimum; may require /26+ with increased usage
  # container_instance_subnet_cidr = "${local.base_ip}.96/28"
  # octets                         = split(".", local.vnet_ip_base)
  # private_endpoints_subnet_cidr  = "${local.base_ip}.112/28"
  # vnet_ip_base                   = split("/", var.vnet_address_space)[0]
  # web_subnet_cidr                = "${local.base_ip}.32/27"

  # Split the address space, retrieve from Azure rather than variable
  vnet_address_space = data.azurerm_virtual_network.main.address_space[0]
  vnet_ip_base       = split("/", local.vnet_address_space)[0]
  octets             = split(".", local.vnet_ip_base)
  base_ip            = "${local.octets[0]}.${local.octets[1]}.${local.octets[2]}"

  app_service_subnet_cidr        = "${local.base_ip}.0/27"
  container_apps_subnet_cidr     = "${local.base_ip}.64/27" # Note: ACA minimum; may require /26+ with increased usage
  container_instance_subnet_cidr = "${local.base_ip}.96/28"
  private_endpoints_subnet_cidr  = "${local.base_ip}.112/28"
  web_subnet_cidr                = "${local.base_ip}.32/27"
}
