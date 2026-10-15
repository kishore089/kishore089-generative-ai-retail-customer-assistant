# Customer profile API Lambda

**Evidence:** The current frontend calls `GET /customer?customerId=...` and `GET /customer?email=...`. The project records also mention a Customer Profile Lambda.

Expected responsibility: return the profile for an authenticated/identified customer.

Recovery requirements: recover the deployed handler, confirm Cognito identity mapping, table/key schema, response envelope, and authorization checks. Do not treat frontend-supplied customer IDs as proof of authorization.
