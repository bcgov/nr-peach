terraform {
  source = "..//infra"
  extra_arguments "tfvars" {
    commands = get_terraform_commands_that_need_vars()
    arguments = ["-var-file=../infra/terraform.tfvars"]
  }
}
