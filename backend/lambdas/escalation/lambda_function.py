"""Escalation handler for retail conversations.

This safely records/returns a handoff request; it does not claim to transfer a
live Amazon Connect call unless an instance ID and valid contact ID are supplied.
"""
import os, json, logging
import boto3
from retail_common import response, parameters
logger=logging.getLogger(); logger.setLevel(os.getenv("LOG_LEVEL","INFO"))
def handler(event, context):
    try:
        params=parameters(event)
        details=event.get("Details") or {}
        connect_params=details.get("Parameters") or {}
        contact_data=(details.get("ContactData") or {})
        reason=params.get("reason") or params.get("message") or params.get("Reason") or "Customer requested a human agent"
        contact_id=params.get("contactId") or params.get("ContactId") or contact_data.get("ContactId")
        instance_id=os.getenv("CONNECT_INSTANCE_ID")
        queue_id=os.getenv("CONNECT_ESCALATION_QUEUE_ID")
        # Connect contact-flow Lambda responses need flat scalar values.
        if details:
            result={"success":"true","escalationStatus":"requested","message":"Your request for a human agent has been recorded."}
            if contact_id: result["contactId"]=str(contact_id)
            return result
        # Optional queue metadata is returned for a downstream Connect flow to route.
        return response(200,{"success":True,"escalationStatus":"requested","reason":str(reason),"contactId":contact_id,"connectInstanceConfigured":bool(instance_id),"queueConfigured":bool(queue_id),"message":"Escalation requested. Continue the contact flow to route the customer to a human agent."})
    except Exception:
        logger.exception("Escalation request failed")
        if event.get("Details"): return {"success":"false","message":"Unable to process escalation request."}
        return response(500,{"success":False,"message":"Unable to process escalation request."})
lambda_handler=handler
