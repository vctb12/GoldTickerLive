import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts" / "python"))

from gold_consensus import choose_consensus, median_absolute_deviation


def quote(provider, price):
    return {"provider": provider, "xau_usd_per_oz": price}


class GoldConsensusTests(unittest.TestCase):
    def test_mad_is_zero_for_equal_quotes(self):
        self.assertEqual(median_absolute_deviation([4712.1, 4712.1, 4712.1]), 0)

    def test_consensus_rejects_large_price_outlier(self):
        selected, details = choose_consensus(
            [
                quote("a", 4712.1),
                quote("b", 4713.0),
                quote("c", 4711.7),
                quote("d", 4712.6),
                quote("e", 3890.0),
            ]
        )
        self.assertIn(selected["provider"], {"a", "b", "c", "d"})
        self.assertEqual(details["method"], "median_consensus")
        self.assertEqual(details["outliers"], ["e"])

    def test_single_provider_is_explicitly_not_called_consensus(self):
        selected, details = choose_consensus([quote("only", 4712.1)])
        self.assertEqual(selected["provider"], "only")
        self.assertEqual(details["method"], "single_provider")

    def test_two_far_apart_quotes_fail_consensus(self):
        selected, details = choose_consensus([quote("a", 4712.1), quote("b", 3900.0)])
        self.assertIsNone(selected)
        self.assertEqual(details["method"], "consensus_failed")


if __name__ == "__main__":
    unittest.main()
