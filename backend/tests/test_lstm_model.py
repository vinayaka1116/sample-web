import unittest

import numpy as np

from app.models.lstm_model import prepare_lstm_sequences


class LstmSequencePreparationTests(unittest.TestCase):
    def test_scaler_and_training_sequences_exclude_test_period(self):
        close_prices = np.arange(1, 201, dtype=float).reshape(-1, 1)
        close_prices[160:] += 10000

        X_train, X_test, y_train, y_test, scaler, scaled, split_index = (
            prepare_lstm_sequences(close_prices)
        )

        self.assertEqual(split_index, 160)
        self.assertEqual(scaler.data_max_[0], 160)
        self.assertEqual(X_train.shape, (100, 60, 1))
        self.assertEqual(X_test.shape, (40, 60, 1))
        self.assertEqual(len(y_train), len(X_train))
        self.assertEqual(len(y_test), len(X_test))
        np.testing.assert_array_equal(X_train[-1, :, 0], scaled[99:159, 0])
        np.testing.assert_array_equal(X_test[0, :, 0], scaled[100:160, 0])
        self.assertEqual(y_test[0], scaled[160, 0])

    def test_rejects_insufficient_training_history(self):
        with self.assertRaisesRegex(ValueError, "Not enough data"):
            prepare_lstm_sequences(np.arange(70, dtype=float))

    def test_rejects_non_finite_prices(self):
        close_prices = np.arange(200, dtype=float)
        close_prices[120] = np.nan

        with self.assertRaisesRegex(ValueError, "finite values"):
            prepare_lstm_sequences(close_prices)


if __name__ == "__main__":
    unittest.main()
