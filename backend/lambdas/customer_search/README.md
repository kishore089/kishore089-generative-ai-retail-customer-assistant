# Admin customer search Lambda

**Evidence:** The frontend has an admin customer search service calling `GET /customer-search`; prior project context states this endpoint was implemented.

Expected responsibility: search/resolve customer records for the admin customer-context workflow.

Recovery requirements: restore the actual handler and confirm supported search fields, access controls, response envelope, and rate/scan limits.
