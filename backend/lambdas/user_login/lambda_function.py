"""User identity lookup helper. Authentication itself should remain with Cognito.

This endpoint never verifies passwords and never stores credentials. It returns
minimal claims supplied by a trusted authorizer context, or a configuration
message if invoked without an authenticated identity.
"""
import os
from retail_common import response
def handler(event, context):
    try:
        rc=event.get("requestContext") or {}
        authorizer=rc.get("authorizer") or {}
        claims=authorizer.get("claims") or (authorizer.get("jwt") or {}).get("claims") or {}
        if not claims:
            return response(401,{"success":False,"message":"An authenticated Cognito identity is required."})
        result={"success":True,"user":{"sub":claims.get("sub"),"email":claims.get("email"),"username":claims.get("cognito:username") or claims.get("username"),"groups":claims.get("cognito:groups",[]) }}
        return response(200,result)
    except Exception:
        return response(500,{"success":False,"message":"Unable to resolve user identity."})
lambda_handler=handler
