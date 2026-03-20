terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "aws" {
  source       = "./modules/aws"
  project_name = var.project_name
  aws_region   = var.aws_region
  domain       = var.domain
}
