terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

# ---------- Cloud Storage: cinema.db ----------

resource "google_storage_bucket" "data" {
  name     = "${var.project_name}-data-${var.gcp_project}"
  location = var.gcp_region

  uniform_bucket_level_access = true
  versioning { enabled = true }
}

# ---------- Artifact Registry ----------

resource "google_artifact_registry_repository" "repo" {
  location      = var.gcp_region
  repository_id = var.project_name
  format        = "DOCKER"
}

locals {
  image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project}/${google_artifact_registry_repository.repo.repository_id}/${var.project_name}:latest"
}

# ---------- Cloud Run ----------

resource "google_cloud_run_v2_service" "app" {
  name     = var.project_name
  location = var.gcp_region

  template {
    containers {
      image = local.image

      ports {
        container_port = 8080
      }

      env {
        name  = "CINEMA_DB_PATH"
        value = "/data/cinema.db"
      }

      env {
        name  = "DATA_BUCKET"
        value = google_storage_bucket.data.name
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      volume_mounts {
        name       = "data"
        mount_path = "/data"
      }
    }

    volumes {
      name = "data"
      empty_dir {
        medium     = "MEMORY"
        size_limit = "100Mi"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
  }
}

# ---------- IAM: Allow unauthenticated access ----------

resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.app.name
  location = google_cloud_run_v2_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------- Service account for scheduler ----------

resource "google_service_account" "scheduler" {
  account_id   = "${var.project_name}-scheduler"
  display_name = "OpenCinema Scheduler"
}

resource "google_cloud_run_v2_service_iam_member" "scheduler_invoker" {
  name     = google_cloud_run_v2_service.app.name
  location = google_cloud_run_v2_service.app.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}

# ---------- Cloud Scheduler: Daily scrape ----------

resource "google_cloud_scheduler_job" "daily_scrape" {
  name     = "${var.project_name}-daily-scrape"
  schedule = "0 6 * * *"
  timezone = "Europe/London"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.app.uri}/api/scrape"

    oidc_token {
      service_account_email = google_service_account.scheduler.email
    }
  }
}

# ---------- Optional domain mapping ----------

resource "google_cloud_run_domain_mapping" "custom" {
  count    = var.domain != "" ? 1 : 0
  name     = var.domain
  location = var.gcp_region

  metadata {
    namespace = var.gcp_project
  }

  spec {
    route_name = google_cloud_run_v2_service.app.name
  }
}
