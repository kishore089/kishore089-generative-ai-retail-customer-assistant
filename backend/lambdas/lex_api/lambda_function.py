"""Web chat API expected by the React frontend; invokes Amazon Lex V2."""
import os, json, logging
import boto3
from retail_common import response, parameters
logger=logging.getLogger(); logger.setLevel(os.getenv("LOG_LEVEL","INFO"))
def handler(event, context):
    try:
        params=parameters(event); message=params.get("message"); customer_id=params.get("customerId") or "web-customer"; session_id=params.get("sessionId") or getattr(context,"aws_request_id","web-session")
        if not message: return response(400,{"success":False,"message":"message is required"})
        bot_id=os.getenv("LEX_BOT_ID"); alias_id=os.getenv("LEX_BOT_ALIAS_ID"); locale=os.getenv("LEX_LOCALE_ID","en_US")
        if not bot_id or not alias_id: return response(500,{"success":False,"message":"Lex is not configured."})
        result=boto3.client("lexv2-runtime").recognize_text(botId=bot_id,botAliasId=alias_id,localeId=locale,sessionId=str(session_id),text=str(message),sessionState={"sessionAttributes":{"customerId":str(customer_id),"channel":"web"}})
        messages=[{"contentType":m.get("contentType","PlainText"),"content":m.get("content","")} for m in result.get("messages",[])]
        text="\n".join(m["content"] for m in messages if m["content"])
        return response(200,{"success":True,"requestId":getattr(context,"aws_request_id",None),"customerId":customer_id,"sessionId":session_id,"source":"LexV2","intent":(result.get("sessionState",{}).get("intent") or {}).get("name"),"message":text,"messages":messages,"sessionState":result.get("sessionState")})
    except Exception as exc:
        logger.exception("Lex chat request failed (%s)",type(exc).__name__)
        return response(502,{"success":False,"message":"The AI service is temporarily unavailable."})
lambda_handler=handler
