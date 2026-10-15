# AIAnalytics Lambda

**Evidence:** The project context refers to an AIAnalytics / analytics Lambda supporting the backend, and the frontend expects an `/analytics` API area.

Expected responsibility: return dashboard metrics and retail activity/analytics for the admin dashboard.

Recovery requirements: export the deployed function and confirm whether it reads DynamoDB, aggregates API results, or uses another data source. Preserve the existing response fields expected by the frontend analytics service. Do not invent table names or metric formulas.
