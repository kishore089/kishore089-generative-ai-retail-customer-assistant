"""Shared helpers for reconstructed Retail Customer Assistant Lambda handlers.

Package this file with a handler when creating a deployment ZIP. All table names
and key names are configurable because the original deployed schemas were lost.
"""
import json
import os
import logging
from decimal import Decimal
from typing import Any

import boto3
from boto3.dynamodb.conditions import Attr, Key

logger = logging.getLogger()
logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

def json_default(value: Any):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    raise TypeError(f"Unsupported JSON value: {type(value).__name__}")

def response(status_code: int, body: Any, headers: dict | None = None) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": os.getenv("CORS_ALLOW_ORIGIN", "*"), **(headers or {})},
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
    result = {}
    for p in event.get("parameters", []) or []:
        if isinstance(p, dict) and p.get("name"):
            result[p["name"]] = p.get("value")
    result.update(event.get("queryStringParameters") or {})
    result.update(parse_body(event))
    return result

def dynamodb_table(table_env: str, default_name: str):
    name = os.getenv(table_env, default_name)
    return boto3.resource("dynamodb").Table(name)

def item_to_json(item):
    return json.loads(json.dumps(item, default=json_default)) if item is not None else None

def find_record(table, params: dict, key_fields: tuple[str, ...]):
    """Prefer exact key lookups; otherwise perform a bounded attribute scan.

    Set the table's actual key field through environment variables where possible.
    Scans are a recovery fallback and should be replaced by indexed queries for
    production workloads.
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
    """Format a Bedrock Agents Action Group function response."""
    action_group = event.get("actionGroup", "RetailBackend")
    function_name = event.get("function", "lookup")
    message_version = event.get("messageVersion", "1.0")
    return {
        "messageVersion": message_version,
        "response": {
            "actionGroup": action_group,
            "function": function_name,
            "functionResponse": {
                "responseBody": {"TEXT": {"body": result_text}}
            },
        },
        "sessionAttributes": session_attributes or event.get("sessionAttributes", {}),
        "promptSessionAttributes": event.get("promptSessionAttributes", {}),
    }

def is_agent_action_event(event: dict) -> bool:
    return bool(event.get("actionGroup") and (event.get("function") or event.get("apiPath")))
