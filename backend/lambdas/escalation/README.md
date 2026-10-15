# Escalation Lambda

A reconstructed handler is available at lambda_function.py. It accepts a handoff request and returns a safe response for API Gateway or Amazon Connect contact-flow use.

The Day 9 report confirms an EscalationLambda was created and tested, but the original implementation is lost. This reconstructed version does not itself transfer a live call or enqueue an agent; configure and test the actual Connect queue/transfer flow separately.
