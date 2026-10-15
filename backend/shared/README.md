# Shared backend utilities

Add shared helpers only after the original Lambda handlers are recovered. Common candidates include JSON/Decimal serialization, response envelopes, structured logging, input validation, and safe error mapping. Keep service-specific authorization and business rules in the appropriate handler.
