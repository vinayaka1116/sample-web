import logging
import math

from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{symbol}")
def get_stock(symbol: str):
    symbol = symbol.strip().upper()

    try:
        ticker = yf.Ticker(symbol)

        data = ticker.history(period="1mo")

        if data.empty:
            raise HTTPException(
                status_code=404,
                detail="Stock not found"
            )

        data = data.dropna(subset=["Close"])
        if len(data) < 2:
            raise HTTPException(
                status_code=422,
                detail="Not enough historical data to calculate price change."
            )

        history = []

        for index, row in data.iterrows():
            history.append({
                "date": index.strftime("%d %b"),
                "price": round(float(row["Close"]), 2)
            })

        current_price = float(data["Close"].iloc[-1])
        previous_price = float(data["Close"].iloc[-2])
        if (
            not math.isfinite(current_price)
            or not math.isfinite(previous_price)
            or previous_price == 0
        ):
            raise HTTPException(
                status_code=422,
                detail="Valid historical prices are unavailable for this symbol."
            )

        change = (
            (current_price - previous_price)
            / previous_price
        ) * 100

        return {
            "symbol": symbol.upper(),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "history": history
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Market data lookup failed for %s", symbol)
        raise HTTPException(
            status_code=502,
            detail="Market data is temporarily unavailable."
        ) from exc