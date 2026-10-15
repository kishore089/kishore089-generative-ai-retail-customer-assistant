import json
import sys
import unittest
from pathlib import Path

SHARED = Path(__file__).resolve().parents[1] / "lambdas" / "_shared"
sys.path.insert(0, str(SHARED))
from retail_common import parse_body, parameters, response, is_agent_action_event

class SharedHelperTests(unittest.TestCase):
    def test_parse_json_body(self):
        self.assertEqual(parse_body({"body": '{"message":"hello"}'}), {"message": "hello"})

    def test_invalid_json_body_is_empty(self):
        self.assertEqual(parse_body({"body": "{"}), {})

    def test_parameters_merges_query_and_body(self):
        self.assertEqual(parameters({"queryStringParameters":{"customerId":"C1"},"body":{"email":"a@example.com"}}), {"customerId":"C1","email":"a@example.com"})

    def test_response_is_json_http_envelope(self):
        result=response(200, {"success":True})
        self.assertEqual(result["statusCode"], 200)
        self.assertEqual(json.loads(result["body"]), {"success":True})

    def test_bedrock_action_group_detection(self):
        self.assertTrue(is_agent_action_event({"actionGroup":"Retail","function":"lookup"}))
        self.assertFalse(is_agent_action_event({"body":"{}"}))

if __name__ == "__main__":
    unittest.main()
