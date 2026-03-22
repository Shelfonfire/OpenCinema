# OpenCinema Deploy

Live on AWS. CI/CD via GitHub Actions. GCP module available but not active.

## Current deployment

| Resource | Value |
|----------|-------|
| URL | https://d3j0dexak5doxz.cloudfront.net |
| Domain | open-cinema.london (ACM cert created, DNS pending) |
| AWS account | 716171483364 |
| AWS profile | `dan-home` |
| Region | eu-west-2 (London) |
| CloudFront | ETGPZG6ZBTA6H |
| S3 frontend | opencinema-frontend-716171483364 |
| S3 data | opencinema-data-716171483364 |
| Lambda API | opencinema-api (256MB, 30s) |
| Lambda scraper | opencinema-scraper (512MB, 300s) |

## CI/CD (GitHub Actions)

Push to `master` auto-deploys:
- `frontend/` changes → build Next.js → sync S3 → invalidate CloudFront
- `backend/` changes → package Lambda zip → update both Lambda functions

Manual trigger: `gh workflow run deploy.yml`

**Secrets** (set in repo): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

## Update screening data

```bash
# 1. Run scrapers (10 scrapers, ~48 cinemas)
cd mcp/cinemadb && conda run -n pyds python scrape_all.py

# 2. Upload DB to S3
aws s3 cp cinema.db s3://opencinema-data-716171483364/cinema.db --profile dan-home

# 3. Force Lambda cold start (downloads fresh DB)
export MSYS_NO_PATHCONV=1
aws lambda update-function-configuration \
  --function-name opencinema-api --region eu-west-2 --profile dan-home \
  --environment '{"Variables":{"CINEMA_DB_PATH":"/tmp/cinema.db","DATA_BUCKET":"opencinema-data-716171483364","DB_VERSION":"N"}}'
```

Increment `DB_VERSION` each time.

## Terraform

```bash
cd deploy/terraform
export AWS_PROFILE=dan-home
terraform init
terraform plan
terraform apply
```

State is local (terraform.tfstate). Terraform manages all AWS resources.

## GCP (alternative, not active)

Available in `modules/gcp/`. Single Cloud Run container. See `Dockerfile` for multi-stage build (Node frontend + Python backend). Would need:
```bash
gcloud projects create opencinema-prod
gcloud services enable run.googleapis.com storage.googleapis.com cloudscheduler.googleapis.com artifactregistry.googleapis.com
terraform apply -var='provider=gcp' -var='gcp_project=opencinema-prod'
```

## Cost

~$0-2/mo on AWS free tier (1M Lambda requests, 1TB CloudFront). After free tier expires: ~$2-5/mo at 100K users/month.
