import logging

import yfinance as yf
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException

router = APIRouter()
logger = logging.getLogger(__name__)


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(period).mean()
    avg_loss = loss.rolling(period).mean()

    rs = avg_gain / avg_loss.replace(0, np.nan)

    return 100 - (100 / (1 + rs))


def clean_number(value):
    if pd.isna(value):
        return None

    return round(float(value), 4)


@router.get("/{symbol}")
def technical_analysis(symbol: str):

    symbol = symbol.strip().upper()

    if not symbol:
        raise HTTPException(
            status_code=400,
            detail="Stock symbol is required"
        )

    try:

        # =====================================================
        # DOWNLOAD DATA
        # =====================================================

        data = yf.download(
            symbol,
            period="1y",
            interval="1d",
            auto_adjust=False,
            progress=False,
            threads=False,
        )

        if data.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No market data found for {symbol}"
            )

        # Handle Yahoo Finance MultiIndex columns
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        if "Close" not in data.columns:
            raise HTTPException(
                status_code=500,
                detail="Yahoo Finance did not return Close data"
            )

        data = data.copy()

        data["Close"] = pd.to_numeric(
            data["Close"],
            errors="coerce"
        )

        data = data.dropna(subset=["Close"])

        if len(data) < 60:
            raise HTTPException(
                status_code=422,
                detail="Not enough historical data to calculate technical indicators"
            )

        # =====================================================
        # PRICE
        # =====================================================

        close = data["Close"]

        price = float(close.iloc[-1])

        # =====================================================
        # MOVING AVERAGES
        # =====================================================

        data["sma20"] = close.rolling(20).mean()

        data["sma50"] = close.rolling(50).mean()

        data["ema20"] = close.ewm(
            span=20,
            adjust=False
        ).mean()

        # =====================================================
        # BOLLINGER BANDS
        # =====================================================

        bb_middle = close.rolling(20).mean()

        bb_std = close.rolling(20).std()

        data["bb_middle"] = bb_middle

        data["bb_upper"] = (
            bb_middle + (2 * bb_std)
        )

        data["bb_lower"] = (
            bb_middle - (2 * bb_std)
        )

        # =====================================================
        # RSI
        # =====================================================

        data["rsi"] = calculate_rsi(close)

        # =====================================================
        # MACD
        # =====================================================

        ema12 = close.ewm(
            span=12,
            adjust=False
        ).mean()

        ema26 = close.ewm(
            span=26,
            adjust=False
        ).mean()

        data["macd"] = ema12 - ema26

        data["macd_signal"] = data["macd"].ewm(
            span=9,
            adjust=False
        ).mean()

        # =====================================================
        # VOLATILITY
        # =====================================================

        daily_returns = close.pct_change()

        data["volatility"] = (
            daily_returns.rolling(20).std()
            * np.sqrt(252)
            * 100
        )

        # =====================================================
        # LATEST VALUES
        # =====================================================

        latest = data.iloc[-1]

        rsi = float(latest["rsi"])

        macd = float(latest["macd"])

        macd_signal = float(
            latest["macd_signal"]
        )

        sma20 = float(latest["sma20"])

        sma50 = float(latest["sma50"])

        ema20 = float(latest["ema20"])

        volatility = (
            float(latest["volatility"])
            if pd.notna(latest["volatility"])
            else 0.0
        )

        bb_upper = float(latest["bb_upper"])

        bb_middle_value = float(
            latest["bb_middle"]
        )

        bb_lower = float(latest["bb_lower"])

        # =====================================================
        # RSI SIGNAL
        # =====================================================

        if rsi >= 70:

            rsi_signal = "Overbought"

        elif rsi <= 30:

            rsi_signal = "Oversold"

        else:

            rsi_signal = "Neutral"

        # =====================================================
        # MACD TREND
        # =====================================================

        if macd > macd_signal:

            macd_trend = "Bullish"

        elif macd < macd_signal:

            macd_trend = "Bearish"

        else:

            macd_trend = "Neutral"

        # =====================================================
        # MOVING AVERAGE TREND
        # =====================================================

        if price > sma20 and sma20 > sma50:

            moving_average_trend = "Strong Bullish"

        elif price > sma20:

            moving_average_trend = "Bullish"

        elif price < sma20 and sma20 < sma50:

            moving_average_trend = "Strong Bearish"

        elif price < sma20:

            moving_average_trend = "Bearish"

        else:

            moving_average_trend = "Neutral"

        # =====================================================
        # BULLISH / BEARISH INDICATOR COUNT
        # =====================================================

        bullish = 0
        bearish = 0

        # Price vs SMA20
        if price > sma20:
            bullish += 1
        else:
            bearish += 1

        # Price vs SMA50
        if price > sma50:
            bullish += 1
        else:
            bearish += 1

        # Price vs EMA20
        if price > ema20:
            bullish += 1
        else:
            bearish += 1

        # SMA20 vs SMA50
        if sma20 > sma50:
            bullish += 1
        else:
            bearish += 1

        # RSI
        if rsi > 55:

            bullish += 1

        elif rsi < 45:

            bearish += 1

        # MACD
        if macd > macd_signal:

            bullish += 1

        else:

            bearish += 1

        # =====================================================
        # OVERALL SIGNAL
        # =====================================================

        if bullish > bearish:

            overall_signal = "BULLISH"

        elif bearish > bullish:

            overall_signal = "BEARISH"

        else:

            overall_signal = "NEUTRAL"

        # =====================================================
        # TECHNICAL MARKET SCORE
        # SCORE RANGE: 5 - 95
        # =====================================================

        score = 50

        # Price vs SMA20
        if price > sma20:

            score += 10

        else:

            score -= 10

        # Price vs SMA50
        if price > sma50:

            score += 10

        else:

            score -= 10

        # Price vs EMA20
        if price > ema20:

            score += 10

        else:

            score -= 10

        # SMA20 vs SMA50
        if sma20 > sma50:

            score += 10

        else:

            score -= 10

        # MACD
        if macd > macd_signal:

            score += 15

        else:

            score -= 15

        # RSI
        if 50 <= rsi <= 65:

            score += 15

        elif 45 <= rsi < 50:

            score += 8

        elif 30 <= rsi < 45:

            score -= 3

        elif rsi < 30:

            # Oversold does not automatically mean bullish
            score -= 5

        elif 65 < rsi <= 70:

            score += 5

        else:

            score -= 5

        # Bollinger Band position
        if price > bb_middle_value:

            score += 5

        else:

            score -= 5

        # Keep score between 5 and 95
        market_score = int(
            max(
                5,
                min(
                    95,
                    round(score)
                )
            )
        )

        # =====================================================
        # HISTORICAL DATA
        # =====================================================

        history = []

        chart_data = data.tail(180)

        for index, row in chart_data.iterrows():

            history.append(
                {
                    "date": index.strftime(
                        "%Y-%m-%d"
                    ),

                    "close": clean_number(
                        row["Close"]
                    ),

                    "sma20": clean_number(
                        row["sma20"]
                    ),

                    "sma50": clean_number(
                        row["sma50"]
                    ),

                    "ema20": clean_number(
                        row["ema20"]
                    ),

                    "rsi": clean_number(
                        row["rsi"]
                    ),

                    "macd": clean_number(
                        row["macd"]
                    ),

                    "macd_signal": clean_number(
                        row["macd_signal"]
                    ),

                    "volatility": clean_number(
                        row["volatility"]
                    ),

                    "bb_upper": clean_number(
                        row["bb_upper"]
                    ),

                    "bb_middle": clean_number(
                        row["bb_middle"]
                    ),

                    "bb_lower": clean_number(
                        row["bb_lower"]
                    ),
                }
            )

        # =====================================================
        # RESPONSE
        # =====================================================

        return {

            "success": True,

            "symbol": symbol,

            "price": round(
                price,
                2
            ),

            "market_score": market_score,

            "overall_signal": overall_signal,

            "rsi": {

                "value": round(
                    rsi,
                    2
                ),

                "signal": rsi_signal
            },

            "macd": {

                "value": round(
                    macd,
                    4
                ),

                "signal": round(
                    macd_signal,
                    4
                ),

                "trend": macd_trend
            },

            "moving_average": {

                "sma20": round(
                    sma20,
                    2
                ),

                "sma50": round(
                    sma50,
                    2
                ),

                "ema20": round(
                    ema20,
                    2
                ),

                "trend": moving_average_trend
            },

            "bollinger": {

                "upper": round(
                    bb_upper,
                    2
                ),

                "middle": round(
                    bb_middle_value,
                    2
                ),

                "lower": round(
                    bb_lower,
                    2
                )
            },

            "volatility": round(
                volatility,
                2
            ),

            "history": history
        }

    except HTTPException:

        raise

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Technical analysis failed for %s", symbol)
        raise HTTPException(
            status_code=502,
            detail="Technical analysis is temporarily unavailable."
        ) from exc