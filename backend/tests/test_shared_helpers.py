import json
import sys
import unittest
from pathlib import Path

SHARED = Path(__file__).resolve().parents[1] / "lambdas" / "_shared"
sys.path.insert(0, str(SHARED))
from retail_common import parse_body, parameters, response, is_agent_action_event, bedrock_agent_response

class SharedHelperTests(unittest.TestCase):
    def test_parse_json_body(self):
        self.assertEqual(parse_body({"body": '{"message":"hello"}'}), {"message": "hello"})

    def test_invalid_json_body_is_empty(self):
        self.assertEqual(parse_body({"body": "{"}), {})

    def test_parameters_merges_query_path_and_body(self):
        event={"queryStringParameters":{"customerId":"C1"},"pathParameters":{"OrdersID":"O1"},"body":{"email":"a@example.com"}}
        self.assertEqual(parameters(event), {"customerId":"C1","OrdersID":"O1","email":"a@example.com"})

    def test_bedrock_openapi_request_body_properties(self):
        event={"requestBody":{"content":{"application/json":{"properties":[{"name":"message","value":"hello"}]}}}}
        self.assertEqual(parameters(event), {"message":"hello"})

    def test_response_is_json_http_envelope(self):
        result=response(200, {"success":True})
        self.assertEqual(result["statusCode"], 200)
        self.assertEqual(json.loads(result["body"]), {"success":True})

    def test_bedrock_action_group_detection(self):
        self.assertTrue(is_agent_action_event({"actionGroup":"Retail","function":"lookup"}))
        self.assertTrue(is_agent_action_event({"actionGroup":"Retail","apiPath":"/orders"}))
        self.assertFalse(is_agent_action_event({"body":"{}"}))

    def test_function_action_group_response_shape(self):
        result=bedrock_agent_response({"actionGroup":"Retail","function":"lookup","messageVersion":"1.0"},"{}")
        self.assertEqual(result["response"]["function"],"lookup")
        self.assertIn("TEXT",result["response"]["functionResponse"]["responseBody"])

    def test_openapi_action_group_response_shape(self):
        result=bedrock_agent_response({"actionGroup":"Retail","apiPath":"/orders","httpMethod":"GET"},"{}")
        self.assertEqual(result["response"]["apiPath"],"/orders")
        self.assertEqual(result["response"]["httpStatusCode"],200)
        self.assertEqual(result["response"]["responseBody"]["application/json"]["body"],"{}")
        self.assertNotIn("apiResponse",result["response"])

if __name__ == "__main__":
    unittest.main()
