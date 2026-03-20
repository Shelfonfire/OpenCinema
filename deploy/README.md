# OpenCinema Deploy

Two paths: AWS (S3+CloudFront+Lambda) or GCP (Cloud Run single container). Both target ~$0-3/mo on free tier.

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- Docker (for GCP path)
- AWS CLI or gcloud CLI

## AWS Setup (New Personal Account)

1. Create account at https://aws.amazon.com (use personal email, NOT work)
2. Sign in as root, go to IAM > Users > Create user
   - Name: `admin`, attach `AdministratorAccess` policy
   - Create access key (CLI use case)
3. Configure CLI:
   ```bash
   aws configure --profile personal
   # Enter access key, secret, region: eu-west-2, output: json
   ```
4. Set profile: `export AWS_PROFILE=personal`

### Deploy to AWS

```bash
cd deploy/terraform

# Create dummy.zip for initial Lambda placeholder
cd modules/aws && zip dummy.zip -j /dev/null && cd ../..

terraform init
terraform plan -var="provider=aws"
terraform apply -var="provider=aws"
```

### Upload cinema.db (AWS)

```bash
aws s3 cp cinema.db s3://opencinema-data-<ACCOUNT_ID>/cinema.db
```

### Update frontend (AWS)

```bash
cd ../.. && cd frontend && npm run build
aws s3 sync out/ s3://opencinema-frontend-<ACCOUNT_ID>/ --delete
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

### Deploy Lambda code (AWS)

Package backend + mangum into a zip and update both Lambda functions:
```bash
cd backend && pip install -r requirements.txt -t package/ && cd package
zip -r ../../lambda.zip . && cd .. && zip -r ../lambda.zip backend/
aws lambda update-function-code --function-name opencinema-api --zip-file fileb://lambda.zip
aws lambda update-function-code --function-name opencinema-scraper --zip-file fileb://lambda.zip
```

---

## GCP Setup (New Personal Project)

1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
2. Create project:
   ```bash
   gcloud projects create opencinema-prod --name="OpenCinema"
   gcloud config set project opencinema-prod
   ```
3. Enable billing: https://console.cloud.google.com/billing (link project)
4. Enable APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     storage.googleapis.com \
     cloudscheduler.googleapis.com \
     artifactregistry.googleapis.com
   ```
5. Auth for Terraform:
   ```bash
   gcloud auth application-default login
   ```

### Deploy to GCP

```bash
# Build + push container
cd deploy
docker build -t opencinema -f Dockerfile ..
docker tag opencinema europe-west2-docker.pkg.dev/opencinema-prod/opencinema/opencinema:latest

# First run terraform to create Artifact Registry
cd terraform
terraform init
terraform plan -var='provider=gcp' -var='gcp_project=opencinema-prod'
terraform apply -var='provider=gcp' -var='gcp_project=opencinema-prod'

# Push image (after registry exists)
gcloud auth configure-docker europe-west2-docker.pkg.dev
docker push europe-west2-docker.pkg.dev/opencinema-prod/opencinema/opencinema:latest
```

### Upload cinema.db (GCP)

```bash
gsutil cp cinema.db gs://opencinema-data-opencinema-prod/cinema.db
```

### Update (GCP)

Rebuild + push Docker image, then:
```bash
gcloud run services update opencinema --region europe-west2 --image europe-west2-docker.pkg.dev/opencinema-prod/opencinema/opencinema:latest
```

---

## Cost Estimates

| | AWS | GCP |
|---|---|---|
| Compute | Lambda free tier: 1M req/mo | Cloud Run free tier: 2M req/mo |
| Storage | S3: ~$0.02/mo | GCS: ~$0.02/mo |
| CDN | CloudFront: 1TB free/mo | Included in Cloud Run |
| Scheduler | EventBridge: free | Cloud Scheduler: 3 free jobs |
| **Total** | **$0-2/mo** | **$0-3/mo** |

## Custom Domain

Pass `-var='domain=cinema.example.com'` to terraform apply. AWS uses CloudFront (need ACM cert), GCP uses Cloud Run domain mapping (auto-cert).
