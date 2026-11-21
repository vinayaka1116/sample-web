import logging

import yfinance as yf

logger = logging.getLogger(__name__)


def search_stocks(query: str):
    query = query.strip()

    if not query:
        return {
            "success": False,
            "query": query,
            "results": []
        }

    try:
        search = yf.Search(query, max_results=10)

        results = []

        for item in search.quotes:
            symbol = item.get("symbol")
            name = (
                item.get("longname")
                or item.get("shortname")
                or item.get("name")
            )

            if symbol and name:
                results.append({
                    "symbol": symbol,
                    "name": name,
                    "exchange": item.get("exchange"),
                    "type": item.get("quoteType")
                })

        return {
            "success": True,
            "query": query,
            "results": results
        }

    except Exception:
        logger.exception("Market search failed")
        return {
            "success": False,
            "query": query,
            "results": [],
            "error": "Market search is temporarily unavailable."
        }