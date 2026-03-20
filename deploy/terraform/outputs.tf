output "url" {
  description = "Application URL"
  value       = var.provider == "aws" ? module.aws[0].url : module.gcp[0].url
}
