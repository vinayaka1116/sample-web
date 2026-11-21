import logging

from fastapi import APIRouter, HTTPException

import numpy as np
import pandas as pd
import yfinance as yf


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{symbol}")
def risk_analysis(symbol: str):

    try:

        symbol = symbol.upper()

        # Stock data
        stock = yf.download(
            symbol,
            period="1y",
            interval="1d",
            auto_adjust=True,
            progress=False
        )

        if stock.empty:
            raise Exception(
                f"No stock data available for {symbol}"
            )

        if isinstance(
            stock.columns,
            pd.MultiIndex
        ):
            stock.columns = (
                stock.columns
                .get_level_values(0)
            )

        # NIFTY data
        market = yf.download(
            "^NSEI",
            period="1y",
            interval="1d",
            auto_adjust=True,
            progress=False
        )

        if isinstance(
            market.columns,
            pd.MultiIndex
        ):
            market.columns = (
                market.columns
                .get_level_values(0)
            )

        stock_close = (
            stock["Close"]
            .astype(float)
        )

        market_close = (
            market["Close"]
            .astype(float)
        )

        stock_returns = (
            stock_close.pct_change()
            .dropna()
        )

        market_returns = (
            market_close.pct_change()
            .dropna()
        )

        # Volatility
        volatility = (
            stock_returns.std()
            * np.sqrt(252)
            * 100
        )

        # Beta
        combined = pd.concat(
            [
                stock_returns,
                market_returns
            ],
            axis=1
        ).dropna()

        if len(combined) > 10:

            covariance = np.cov(
                combined.iloc[:, 0],
                combined.iloc[:, 1]
            )[0][1]

            market_variance = np.var(
                combined.iloc[:, 1]
            )

            beta = (
                covariance /
                market_variance
                if market_variance != 0
                else 1
            )

        else:

            beta = 1

        # Drawdown
        cumulative = (
            1 + stock_returns
        ).cumprod()

        running_max = (
            cumulative.cummax()
        )

        drawdown = (
            cumulative /
            running_max
            - 1
        )

        max_drawdown = (
            drawdown.min() * 100
        )

        # Sharpe ratio
        annual_return = (
            stock_returns.mean()
            * 252
        )

        annual_volatility = (
            stock_returns.std()
            * np.sqrt(252)
        )

        if annual_volatility != 0:

            sharpe = (
                annual_return /
                annual_volatility
            )

        else:

            sharpe = 0

        # VaR 95
        var95 = (
            np.percentile(
                stock_returns,
                5
            ) * 100
        )

        # Risk score
        risk_score = 50

        if volatility > 30:
            risk_score += 20

        elif volatility > 20:
            risk_score += 10

        elif volatility < 15:
            risk_score -= 10

        if abs(max_drawdown) > 30:
            risk_score += 15

        elif abs(max_drawdown) > 20:
            risk_score += 10

        if beta > 1.3:
            risk_score += 10

        elif beta < 0.8:
            risk_score -= 5

        risk_score = max(
            0,
            min(100, int(risk_score))
        )

        if risk_score >= 70:
            risk_level = "HIGH"

        elif risk_score >= 45:
            risk_level = "MODERATE"

        else:
            risk_level = "LOW"

        if beta > 1.2:
            beta_status = (
                "High market sensitivity"
            )

        elif beta < 0.8:
            beta_status = (
                "Low market sensitivity"
            )

        else:
            beta_status = (
                "Moderate market sensitivity"
            )

        if sharpe > 1:
            sharpe_status = (
                "Good risk-adjusted return"
            )

        elif sharpe > 0:
            sharpe_status = (
                "Moderate risk-adjusted return"
            )

        else:
            sharpe_status = (
                "Poor risk-adjusted return"
            )

        # Risk history
        daily_volatility = (
            stock_returns
            .rolling(20)
            .std()
            * np.sqrt(252)
            * 100
        )

        history = []

        for index in daily_volatility.index:

            vol = daily_volatility.loc[index]

            dd = drawdown.loc[index]

            if pd.isna(vol):
                continue

            history.append({
                "date": index.strftime(
                    "%d %b"
                ),
                "volatility": round(
                    float(vol),
                    2
                ),
                "drawdown": round(
                    float(dd * 100),
                    2
                )
            })

        history = history[-180:]

        return {

            "symbol": symbol,

            "risk_score": risk_score,

            "risk_level": risk_level,

            "volatility": round(
                float(volatility),
                2
            ),

            "beta": round(
                float(beta),
                2
            ),

            "beta_status": beta_status,

            "max_drawdown": round(
                float(max_drawdown),
                2
            ),

            "sharpe_ratio": round(
                float(sharpe),
                2
            ),

            "sharpe_status": sharpe_status,

            "value_at_risk_95": round(
                float(var95),
                2
            ),

            "history": history
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Risk analysis failed for %s", symbol)
        raise HTTPException(
            status_code=502,
            detail="Risk analysis is temporarily unavailable."
        ) from exc