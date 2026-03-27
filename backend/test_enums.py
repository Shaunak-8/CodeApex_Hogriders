import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from api.enums import IterationStatusEnum, parse_iteration_status, normalize_status, sanitize_result
import unittest

class TestEnumNormalization(unittest.TestCase):
    def test_normalize_status(self):
        self.assertEqual(normalize_status("FAIL"), "failed")
        self.assertEqual(normalize_status("fail"), "failed")
        self.assertEqual(normalize_status("PASS"), "passed")
        self.assertEqual(normalize_status("pass"), "passed")
        self.assertEqual(normalize_status("SUCCESS"), "passed")
        self.assertEqual(normalize_status("running"), "running")

    def test_sanitize_result(self):
        res = {"status": "FAIL", "bug_type": "linting", "other": "data"}
        sanitized = sanitize_result(res)
        self.assertEqual(sanitized["status"], "failed")
        self.assertEqual(sanitized["bug_type"], "LINTING")
        self.assertEqual(sanitized["other"], "data")

    def test_parse_passed(self):
        self.assertEqual(parse_iteration_status("PASSED"), IterationStatusEnum.passed)
        self.assertEqual(parse_iteration_status("  Passed  "), IterationStatusEnum.passed)
        self.assertEqual(parse_iteration_status("passed"), IterationStatusEnum.passed)

    def test_parse_running(self):
        self.assertEqual(parse_iteration_status("RUNNING"), IterationStatusEnum.running)
        self.assertEqual(parse_iteration_status("running"), IterationStatusEnum.running)

    def test_parse_fail(self):
        self.assertEqual(parse_iteration_status("FAIL"), IterationStatusEnum.failed)
        self.assertEqual(parse_iteration_status("fail"), IterationStatusEnum.failed)
        self.assertEqual(parse_iteration_status("failed"), IterationStatusEnum.failed)
        self.assertEqual(parse_iteration_status("FAILED"), IterationStatusEnum.failed)

    def test_aliases(self):
        self.assertEqual(parse_iteration_status("PASSED"), IterationStatusEnum.passed)
        self.assertEqual(parse_iteration_status("passed"), IterationStatusEnum.passed)
        self.assertEqual(parse_iteration_status("SUCCESS"), IterationStatusEnum.passed)

    def test_invalid(self):
        with self.assertRaises(ValueError) as cm:
            parse_iteration_status("GOPASS")
        self.assertIn("is not a valid IterationStatusEnum", str(cm.exception))

if __name__ == "__main__":
    unittest.main()
