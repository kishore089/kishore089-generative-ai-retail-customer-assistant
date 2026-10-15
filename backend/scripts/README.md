# Backend scripts

Run from the repository root:

    python backend/scripts/package_lambdas.py

This creates one ZIP per folder containing a lambda_function.py and includes the shared retail_common.py helper in each archive. ZIPs are written to backend/dist/ (ignored by Git). The script does not deploy resources.

Before using a ZIP, verify the deployed function's event contract, environment variables, IAM role, runtime, DynamoDB key schema, and API/Action Group integration. These handlers are reconstructed approximations because the original source was lost.
