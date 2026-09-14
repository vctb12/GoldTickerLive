"""Tests for scripts/python/record_price_history.py Supabase retry logic."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT / "scripts" / "python"))

import record_price_history as rph  # noqa: E402


class RecordPriceHistoryTests(unittest.TestCase):
    def test_transient_supabase_error_detects_gateway_timeout(self):
        exc = Exception(
            "{'message': 'JSON could not be generated', 'code': 504, "
            "'details': 'b\\'{\"message\":\"Gateway Timeout\"}\\''}"
        )
        self.assertTrue(rph._is_transient_supabase_error(exc))

    def test_transient_supabase_error_ignores_auth_failures(self):
        exc = Exception("Invalid API key")
        self.assertFalse(rph._is_transient_supabase_error(exc))

    @patch.dict(
        "os.environ",
        {
            "SUPABASE_URL": "https://example.supabase.co",
            "SUPABASE_SERVICE_KEY": "service-key",
        },
        clear=False,
    )
    @patch.object(rph.time, "sleep", lambda _seconds: None)
    def test_insert_to_supabase_retries_transient_errors(self):
        attempts = {"count": 0}

        class FakeResult:
            data = [{"karat": 24}]

        def fake_insert_once(rows, url, key):
            attempts["count"] += 1
            if attempts["count"] < 3:
                raise Exception(
                    "{'message': 'JSON could not be generated', 'code': 504, "
                    "'details': 'b\\'{\"message\":\"Gateway Timeout\"}\\''}"
                )
            return FakeResult()

        with patch.object(rph, "_insert_once", fake_insert_once):
            rows = [{"karat": 24, "price_aed": 1.0, "price_usd": 1.0}]
            self.assertTrue(rph.insert_to_supabase(rows, max_retries=3))
            self.assertEqual(attempts["count"], 3)

    @patch.dict(
        "os.environ",
        {
            "SUPABASE_URL": "https://example.supabase.co",
            "SUPABASE_SERVICE_KEY": "service-key",
        },
        clear=False,
    )
    @patch.object(rph.time, "sleep", lambda _seconds: None)
    def test_insert_to_supabase_fails_after_exhausted_retries(self):
        def fake_insert_once(rows, url, key):
            raise Exception(
                "{'message': 'JSON could not be generated', 'code': 504, "
                "'details': 'b\\'{\"message\":\"Gateway Timeout\"}\\''}"
            )

        with patch.object(rph, "_insert_once", fake_insert_once):
            rows = [{"karat": 24, "price_aed": 1.0, "price_usd": 1.0}]
            self.assertFalse(rph.insert_to_supabase(rows, max_retries=3))


if __name__ == "__main__":
    unittest.main()
