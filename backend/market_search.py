import yfinance as yf


def search_stocks(query: str):
    query = query.strip()

    if not query:
        return {
            "success": False,
            "query": query,
            "results": [],
            "error": "Search query is empty"
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

            if not symbol or not name:
                continue

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

    except Exception as e:
        return {
            "success": False,
            "query": query,
            "results": [],
            "error": str(e)
        }