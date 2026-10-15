# 🧩 Retail Customer Assistant — Backend
### Reconstructed AWS Lambda handlers and Agent/Connect integration

<p align="center">
<img alt="Python" src="https://img.shields.io/badge/Backend-Python%20Lambda-3776AB?logo=python&logoColor=white">
<img alt="AWS" src="https://img.shields.io/badge/Cloud-AWS-orange?logo=amazonaws&logoColor=white">
<img alt="Status" src="https://img.shields.io/badge/Status-Reconstruction%20needs%20validation-yellow">
</p>

This branch contains backend Lambda handlers and supporting scripts for the Generative AI Retail Customer Assistant.

> **Important:** The original Lambda source files were lost. The handlers in this branch are reconstructed from project progress reports, frontend contracts, and the updated architecture; they are not byte-for-byte recovered originals. Validate all event schemas, DynamoDB keys, permissions, and business rules before deployment.

## Handler inventory
- Customer, product, order, inventory, payment, return, and support-ticket lookup
- RetailConnectBridge for Bedrock Agent invocation
- Escalation Lambda
- AIAnalytics
- Customer login/profile/search
- Order status update and cancellation
- Lex chat API and utility handler
- Shared parsing, response, and DynamoDB helpers

## Backend checks

~~~bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements-dev.txt
python -m compileall -q backend/lambdas backend/scripts backend/tests
python -m unittest discover -s backend/tests -p "test_*.py" -v
~~~

Build individual Lambda ZIP packages:

~~~bash
python backend/scripts/package_lambdas.py
~~~

Packaging creates ZIP artifacts only; it does not deploy functions or configure AWS resources.

## Must validate before deployment
1. DynamoDB table names, partition/sort keys, indexes, and attribute casing.
2. Bedrock Agent ID/alias, Action Group schemas, target mappings, and response envelopes.
3. IAM permissions and Cognito/API Gateway authorization.
4. Customer ownership and admin-role enforcement.
5. Order cancellation and status-transition business rules.
6. Lex V2 and Connect event contracts, escalation prompt, and actual live-agent transfer.
7. AIAnalytics source data and metric definitions.

## Project references
- [AWS architecture diagram](docs/architecture.svg)
- [Architecture notes](docs/architecture.md)
- [Agent Classic master prompt — Product Routing v5.0](docs/agent-classic-master-prompt.md)
- [Lambda inventory](docs/lambda-inventory.md)
- [Reconstruction verification checklist](docs/reconstruction-verification.md)
- [Backend-specific guide](backend/README.md)

The integrated project is maintained in main. This branch intentionally excludes the frontend source.
