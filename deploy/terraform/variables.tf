variable "project_name" {
  default = "opencinema"
}

variable "provider" {
  description = "aws or gcp"
  type        = string
}

variable "aws_region" {
  default = "eu-west-2"
}

variable "gcp_project" {
  default = ""
}

variable "gcp_region" {
  default = "europe-west2"
}

variable "domain" {
  default     = ""
  description = "Optional custom domain"
}
