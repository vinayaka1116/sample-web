import numpy as np
import pandas as pd
import yfinance as yf

from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
from xgboost import XGBRegressor


def train_xgboost(symbol: str):

    symbol = symbol.upper().strip()

    print(f"Starting XGBoost prediction for {symbol}")

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
        raise Exception(f"No market data available for {symbol}")

    # Fix Yahoo Finance MultiIndex
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    required = [
        "Open",
        "High",
        "Low",
        "Close",
        "Volume"
    ]

    for col in required:
        if col not in df.columns:
            raise Exception(f"Missing column: {col}")

    df = df.copy()

    # Make sure numeric columns are numeric
    for col in required:
        df[col] = pd.to_numeric(
            df[col],
            errors="coerce"
        )

    df.dropna(subset=required, inplace=True)

    # ---------------------------------------------------------
    # TECHNICAL FEATURES
    # ---------------------------------------------------------

    df["SMA20"] = (
        df["Close"]
        .rolling(20)
        .mean()
    )

    df["SMA50"] = (
        df["Close"]
        .rolling(50)
        .mean()
    )

    df["EMA20"] = (
        df["Close"]
        .ewm(
            span=20,
            adjust=False
        )
        .mean()
    )

    df["Volatility"] = (
        df["Close"]
        .pct_change()
        .rolling(20)
        .std()
        * 100
    )

    # ---------------------------------------------------------
    # NEXT DAY TARGET
    # ---------------------------------------------------------

    df["Target"] = df["Close"].shift(-1)

    df.dropna(inplace=True)

    if len(df) < 150:
        raise Exception(
            "Not enough historical data for XGBoost"
        )

    # ---------------------------------------------------------
    # FEATURES
    # ---------------------------------------------------------

    features = [
        "Open",
        "High",
        "Low",
        "Close",
        "Volume",
        "SMA20",
        "SMA50",
        "EMA20",
        "Volatility"
    ]

    X = df[features]
    y = df["Target"]

    # ---------------------------------------------------------
    # TRAIN / TEST SPLIT
    # ---------------------------------------------------------

    split = int(len(df) * 0.80)

    X_train = X.iloc[:split]
    X_test = X.iloc[split:]

    y_train = y.iloc[:split]
    y_test = y.iloc[split:]

    # ---------------------------------------------------------
    # SCALING
    # ---------------------------------------------------------

    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(
        X_train
    )

    X_test_scaled = scaler.transform(
        X_test
    )

    # ---------------------------------------------------------
    # XGBOOST MODEL
    # ---------------------------------------------------------

    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=2
    )

    model.fit(
        X_train_scaled,
        y_train
    )

    # ---------------------------------------------------------
    # TEST PREDICTIONS
    # ---------------------------------------------------------

    test_predictions = model.predict(
        X_test_scaled
    )

    mae = mean_absolute_error(
        y_test,
        test_predictions
    )

    mape = mean_absolute_percentage_error(
        y_test,
        test_predictions
    ) * 100

    # ---------------------------------------------------------
    # LATEST PRICE
    # ---------------------------------------------------------

    latest_row = df[features].iloc[-1:].copy()

    latest_scaled = scaler.transform(
        latest_row
    )

    predicted_price = float(
        model.predict(
            latest_scaled
        )[0]
    )

    current_price = float(
        df["Close"].iloc[-1]
    )

    # Prevent unrealistic negative prediction
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
    # DIRECTION
    # ---------------------------------------------------------

    if expected_change > 0.25:
        direction = "BULLISH"

    elif expected_change < -0.25:
        direction = "BEARISH"

    else:
        direction = "NEUTRAL"

    # ---------------------------------------------------------
    # MODEL CONFIDENCE
    # ---------------------------------------------------------

    error_percentage = (
        mae / current_price
    ) * 100

    confidence = (
        100 - error_percentage
    )

    # Keep confidence between 50 and 95
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

    test_dates = df.index[split:]

    for date, actual, predicted in zip(
        test_dates,
        y_test.values,
        test_predictions
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

    # Keep latest 120 points
    history = history[-120:]

    print(
        f"XGBoost completed for {symbol}"
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

        "direction": direction,

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

        "model": "XGBoost",

        "history": history
    }