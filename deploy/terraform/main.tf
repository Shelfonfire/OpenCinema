terraform {
  required_version = ">= 1.5"
}

module "aws" {
  source = "./modules/aws"
  count  = var.provider == "aws" ? 1 : 0

  project_name = var.project_name
  aws_region   = var.aws_region
  domain       = var.domain
}

module "gcp" {
  source = "./modules/gcp"
  count  = var.provider == "gcp" ? 1 : 0

  project_name = var.project_name
  gcp_project  = var.gcp_project
  gcp_region   = var.gcp_region
  domain       = var.domain
}
