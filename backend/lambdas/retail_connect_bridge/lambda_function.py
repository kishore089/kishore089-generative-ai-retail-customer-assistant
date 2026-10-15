"""RetailConnectBridge: Lex V2 / Amazon Connect to Amazon Bedrock Agent.

Set BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID in Lambda environment variables.
The original handler was lost, so event adapters below support common Lex V2 and
Connect contact-flow events and should be validated against saved test events.
"""
import json, os, uuid, logging
import boto3
from botocore.config import Config
from retail_common import response
logger=logging.getLogger(); logger.setLevel(os.getenv("LOG_LEVEL","INFO"))
AWS_RETRY_CONFIG = Config(retries={"max_attempts": 4, "mode": "standard"})
def _text(value):
    if isinstance(value,str): return value
    if value is None: return ""
    return json.dumps(value, ensure_ascii=False)
def _extract(event):
    # Lex V2 fulfillment hook / intent invocation
    session_state=event.get("sessionState") or {}
    intent=session_state.get("intent") or {}
    slots=intent.get("slots") or {}
    slot_values={}
    for key,val in slots.items():
        if isinstance(val,dict):
            sv=val.get("value") or {}
            slot_values[key]=sv.get("interpretedValue") or sv.get("originalValue")
    if event.get("inputTranscript"):
        return event["inputTranscript"], (event.get("sessionId") or str(uuid.uuid4())), "lex", slot_values
    # API Gateway web-chat contract from the current frontend
    body=event.get("body",{})
    if isinstance(body,str):
        try: body=json.loads(body or "{}")
        except json.JSONDecodeError: body={}
    if isinstance(body,dict) and body.get("message"):
        return str(body["message"]), str(body.get("sessionId") or uuid.uuid4()), "web", body
    # Amazon Connect contact-flow Lambda input commonly uses Details.Parameters
    details=event.get("Details") or {}
    params=details.get("Parameters") or {}
    message=params.get("message") or params.get("Message") or params.get("inputTranscript") or params.get("query") or params.get("Query")
    if message:
        return str(message), str(params.get("sessionId") or details.get("ContactData",{}).get("ContactId") or uuid.uuid4()), "connect", params
    return "", str(event.get("sessionId") or uuid.uuid4()), "unknown", {}
def handler(event, context):
    try:
        message,session_id,channel,metadata=_extract(event)
        if not message:
            return response(400,{"success":False,"message":"A message or Lex input transcript is required."})
        agent_id=os.getenv("BEDROCK_AGENT_ID"); alias_id=os.getenv("BEDROCK_AGENT_ALIAS_ID")
        if not agent_id or not alias_id:
            logger.error("BEDROCK_AGENT_ID / BEDROCK_AGENT_ALIAS_ID not configured")
            return response(500,{"success":False,"message":"AI service is not configured."})
        result=boto3.client("bedrock-agent-runtime", config=AWS_RETRY_CONFIG).invoke_agent(
            agentId=agent_id, agentAliasId=alias_id, sessionId=session_id, inputText=message
        )
        chunks=[]
        for part in result.get("completion",[]):
            chunk=part.get("chunk",{}).get("bytes")
            if chunk: chunks.append(chunk.decode("utf-8",errors="replace"))
        answer="".join(chunks).strip() or "I'm sorry, I couldn't generate a response. Please try again."
        if channel=="lex":
            return {"sessionState":{"dialogAction":{"type":"Close"},"intent":intent if (intent:=((event.get("sessionState") or {}).get("intent"))) else {"name":"FallbackIntent","state":"Fulfilled"}}, "messages":[{"contentType":"PlainText","content":answer}]}
        if channel=="connect":
            # Amazon Connect Lambda block expects a flat JSON object of string values.
            return {"success":"true","message":answer,"response":answer,"sessionId":session_id}
        if channel=="web":
            return response(200,{"success":True,"message":answer,"messages":[{"contentType":"PlainText","content":answer}],"sessionId":session_id,"customerId":metadata.get("customerId"),"source":"BedrockAgent"})
        return response(200,{"success":True,"message":answer,"sessionId":session_id})
    except Exception as exc:
        logger.exception("RetailConnectBridge invocation failed (%s)",type(exc).__name__)
        if event.get("inputTranscript"):
            return {"sessionState":{"dialogAction":{"type":"Close"},"intent":{"name":"FallbackIntent","state":"Failed"}},"messages":[{"contentType":"PlainText","content":"The AI service is temporarily unavailable. Please try again."}]}
        if event.get("Details"):
            return {"success":"false","message":"The AI service is temporarily unavailable."}
        return response(502,{"success":False,"message":"The AI service is temporarily unavailable."})
lambda_handler=handler
