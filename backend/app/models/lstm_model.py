import numpy as np
import pandas as pd
import yfinance as yf
import tensorflow as tf

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, LSTM, Dropout, Dense


def prepare_lstm_sequences(close_prices, sequence_length=60, train_ratio=0.8):
    prices = np.asarray(close_prices, dtype=float).reshape(-1, 1)

    if sequence_length < 1:
        raise ValueError("Sequence length must be positive.")
    if not 0 < train_ratio < 1:
        raise ValueError("Training ratio must be between 0 and 1.")
    if not np.isfinite(prices).all():
        raise ValueError("Close prices must contain only finite values.")

    split_index = int(len(prices) * train_ratio)
    if split_index <= sequence_length or split_index >= len(prices):
        raise ValueError("Not enough data for the requested LSTM split.")

    scaler = MinMaxScaler()
    scaler.fit(prices[:split_index])
    scaled_data = scaler.transform(prices)

    X = np.array([
        scaled_data[index - sequence_length:index, 0]
        for index in range(sequence_length, len(scaled_data))
    ])
    y = scaled_data[sequence_length:, 0]
    train_count = split_index - sequence_length

    X = X.reshape(X.shape[0], sequence_length, 1)
    return (
        X[:train_count],
        X[train_count:],
        y[:train_count],
        y[train_count:],
        scaler,
        scaled_data,
        split_index,
    )


def train_lstm(symbol: str):

    symbol = symbol.upper().strip()

    print(f"Starting LSTM prediction for {symbol}")

    # ---------------------------------------------------------
    # DOWNLOAD DATA
    # ---------------------------------------------------------

    df = yf.download(
        symbol,
        period="5y",
        interval="1d",
        auto_adjust=True,
        progress=False,
        threads=False
    )

    if df.empty:
        raise Exception(
            f"No market data available for {symbol}"
        )

    # Fix Yahoo Finance MultiIndex
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    if "Close" not in df.columns:
        raise Exception(
            "Close price not found"
        )

    df = df.copy()

    df["Close"] = pd.to_numeric(
        df["Close"],
        errors="coerce"
    )

    df.dropna(
        subset=["Close"],
        inplace=True
    )

    close = (
        df["Close"]
        .values
        .reshape(-1, 1)
    )

    if len(close) < 200:
        raise Exception(
            "Not enough data for LSTM"
        )

    sequence_length = 60
    (
        X_train,
        X_test,
        y_train,
        y_test,
        scaler,
        scaled_data,
        split_index,
    ) = prepare_lstm_sequences(close, sequence_length)

    # ---------------------------------------------------------
    # CLEAR OLD MODEL
    # ---------------------------------------------------------

    tf.keras.backend.clear_session()

    # ---------------------------------------------------------
    # LSTM MODEL
    # ---------------------------------------------------------

    model = Sequential([
        Input(
            shape=(
                sequence_length,
                1
            )
        ),

        LSTM(
            64,
            return_sequences=True
        ),

        Dropout(0.2),

        LSTM(32),

        Dropout(0.2),

        Dense(16),

        Dense(1)
    ])

    model.compile(
        optimizer="adam",
        loss="mean_squared_error"
    )

    # ---------------------------------------------------------
    # TRAIN
    # ---------------------------------------------------------

    model.fit(
        X_train,
        y_train,
        epochs=8,
        batch_size=32,
        verbose=0
    )

    print(
        f"LSTM training completed for {symbol}"
    )

    # ---------------------------------------------------------
    # TEST PREDICTIONS
    # ---------------------------------------------------------

    predictions_scaled = model.predict(
        X_test,
        verbose=0
    )

    predictions = (
        scaler
        .inverse_transform(
            predictions_scaled
        )
        .flatten()
    )

    actual_prices = (
        scaler
        .inverse_transform(
            y_test.reshape(-1, 1)
        )
        .flatten()
    )

    # ---------------------------------------------------------
    # MODEL ERROR
    # ---------------------------------------------------------

    mae = mean_absolute_error(
        actual_prices,
        predictions
    )

    mape = mean_absolute_percentage_error(
        actual_prices,
        predictions
    ) * 100

    # ---------------------------------------------------------
    # CURRENT PRICE
    # ---------------------------------------------------------

    current_price = float(
        close[-1][0]
    )

    # ---------------------------------------------------------
    # NEXT DAY PREDICTION
    # ---------------------------------------------------------

    last_sequence = scaled_data[
        -sequence_length:
    ]

    last_sequence = last_sequence.reshape(
        1,
        sequence_length,
        1
    )

    next_scaled = model.predict(
        last_sequence,
        verbose=0
    )

    predicted_price = float(
        scaler.inverse_transform(
            next_scaled
        )[0][0]
    )

    # Prevent unrealistic prediction
    predicted_price = max(
        predicted_price,
        current_price * 0.5
    )

    # ---------------------------------------------------------
    # EXPECTED CHANGE
    # ---------------------------------------------------------

    expected_change = (
        (predicted_price - current_price)
        / current_price
    ) * 100

    # ---------------------------------------------------------
    # SIGNAL
    # ---------------------------------------------------------

    if expected_change > 0.25:
        signal = "BULLISH"

    elif expected_change < -0.25:
        signal = "BEARISH"

    else:
        signal = "NEUTRAL"

    # ---------------------------------------------------------
    # CONFIDENCE
    # ---------------------------------------------------------

    error_percentage = (
        mae / current_price
    ) * 100

    confidence = (
        100 - error_percentage
    )

    # Keep between 50 and 95
    confidence = max(
        50,
        min(
            95,
            confidence
        )
    )

    # ---------------------------------------------------------
    # HISTORICAL PREDICTION DATA
    # ---------------------------------------------------------

    history = []

    test_dates = df.index[split_index:]

    for date, actual, predicted in zip(
        test_dates,
        actual_prices,
        predictions
    ):

        history.append({
            "date": date.strftime("%d %b"),

            "actual": round(
                float(actual),
                2
            ),

            "predicted": round(
                float(predicted),
                2
            )
        })

    # Latest 120 points
    history = history[-120:]

    print(
        f"LSTM prediction completed for {symbol}"
    )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return {
        "symbol": symbol,

        "current_price": round(
            current_price,
            2
        ),

        "predicted_price": round(
            predicted_price,
            2
        ),

        "expected_change": round(
            expected_change,
            2
        ),

        "signal": signal,

        "direction": signal,

        "mae": round(
            float(mae),
            2
        ),

        "mape": round(
            float(mape),
            2
        ),

        "confidence": round(
            float(confidence),
            2
        ),

        "model": "LSTM",

        "history": history
    }