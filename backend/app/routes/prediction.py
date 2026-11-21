import logging

from fastapi import APIRouter, HTTPException

from app.models.xgboost_model import train_xgboost
from app.models.lstm_model import train_lstm

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{symbol}")
def predict_stock(symbol: str):
    try:
        symbol = symbol.upper()
        result = train_xgboost(symbol)

        if not result:
            raise Exception("XGBoost returned empty result")

        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("XGBoost prediction failed for %s", symbol)
        raise HTTPException(
            status_code=502,
            detail="XGBoost prediction is temporarily unavailable."
        ) from exc


@router.get("/{symbol}/lstm")
def predict_lstm(symbol: str):
    try:
        symbol = symbol.upper()
        result = train_lstm(symbol)

        if not result:
            raise Exception("LSTM returned empty result")

        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("LSTM prediction failed for %s", symbol)
        raise HTTPException(
            status_code=502,
            detail="LSTM prediction is temporarily unavailable."
        ) from exc