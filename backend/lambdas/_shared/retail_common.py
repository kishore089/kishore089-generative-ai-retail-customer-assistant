"""Shared helpers for reconstructed Retail Customer Assistant Lambda handlers.

The original source and full DynamoDB schemas were lost. Keep unknown table/key
names configurable, and validate these helpers against the real integration
events before deployment.
"""
import json
import os
import logging
from decimal import Decimal
from typing import Any

import boto3
from botocore.config import Config
from boto3.dynamodb.conditions import Attr

logger = logging.getLogger()
logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

AWS_RETRY_CONFIG = Config(retries={"max_attempts": 4, "mode": "standard"})

def json_default(value: Any):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    raise TypeError(f"Unsupported JSON value: {type(value).__name__}")

def response(status_code: int, body: Any, headers: dict | None = None) -> dict:
    origin = os.getenv("CORS_ALLOW_ORIGIN", "*")
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            **(headers or {}),
        },
        "body": json.dumps(body, default=json_default),
    }

def parse_body(event: dict) -> dict:
    body = event.get("body", {})
    if isinstance(body, str):
        try:
            body = json.loads(body) if body else {}
        except json.JSONDecodeError:
            return {}
    return body if isinstance(body, dict) else {}

def parameters(event: dict) -> dict:
    """Flatten common API Gateway and Bedrock Action Group parameter formats."""
    result = {}
    for p in event.get("parameters", []) or []:
        if isinstance(p, dict) and p.get("name"):
            result[p["name"]] = p.get("value")
    result.update(event.get("queryStringParameters") or {})
    result.update(event.get("pathParameters") or {})
    result.update(parse_body(event))
    request_body = event.get("requestBody") or {}
    content = request_body.get("content") or {}
    for media in content.values():
        props = media.get("properties") or []
        if isinstance(props, list):
            for prop in props:
                if isinstance(prop, dict) and prop.get("name"):
                    result[prop["name"]] = prop.get("value")
        elif isinstance(props, dict):
            result.update(props)
    return result

def dynamodb_table(table_env: str, default_name: str):
    name = os.getenv(table_env, default_name)
    resource = boto3.resource("dynamodb", config=AWS_RETRY_CONFIG)
    return resource.Table(name)

def item_to_json(item):
    return json.loads(json.dumps(item, default=json_default)) if item is not None else None

def find_record(table, params: dict, key_fields: tuple[str, ...]):
    """Best-effort recovery lookup.

    WARNING: actual partition/sort keys are unknown. The helper tries direct key
    reads and then a bounded scan. A scan is not an appropriate production
    replacement for known primary keys or GSIs and may miss records beyond the
    evaluated page. Configure the correct key/index before production use.
    """
    for field in key_fields:
        value = params.get(field)
        if value not in (None, ""):
            try:
                result = table.get_item(Key={field: value})
                if result.get("Item"):
                    return result["Item"]
            except Exception as exc:
                logger.debug("Direct lookup on %s unavailable: %s", field, type(exc).__name__)
    for field in key_fields:
        value = params.get(field)
        if value not in (None, ""):
            try:
                result = table.scan(FilterExpression=Attr(field).eq(value), Limit=100)
                items = result.get("Items", [])
                if items:
                    return items[0]
            except Exception as exc:
                logger.debug("Scan lookup on %s unavailable: %s", field, type(exc).__name__)
    return None

def bedrock_agent_response(event: dict, result_text: str, session_attributes: dict | None = None):
    """Format either a Bedrock function-details or OpenAPI Action Group response."""
    action_group = event.get("actionGroup", "RetailBackend")
    message_version = event.get("messageVersion", "1.0")
    if event.get("apiPath") and not event.get("function"):
        response_obj = {
            "actionGroup": action_group,
            "apiPath": event.get("apiPath"),
            "httpMethod": event.get("httpMethod", "GET"),
            "httpStatusCode": 200,
            "responseBody": {"application/json": {"body": result_text}},
        }
    else:
        response_obj = {
            "actionGroup": action_group,
            "function": event.get("function", "lookup"),
            "functionResponse": {"responseBody": {"TEXT": {"body": result_text}}},
        }
    return {
        "messageVersion": message_version,
        "response": response_obj,
        "sessionAttributes": session_attributes or event.get("sessionAttributes", {}),
        "promptSessionAttributes": event.get("promptSessionAttributes", {}),
    }

def is_agent_action_event(event: dict) -> bool:
    return bool(event.get("actionGroup") and (event.get("function") or event.get("apiPath")))
