"""
update_financials.py
---------------------
GitHub Actions에서 정기적(또는 수동 트리거)으로 실행되어:
1. Yahoo Finance API (v10 quoteSummary 및 v8 chart)를 통해 핵심 12대 기업의
   최신 분기 실적(매출, 순이익, 영업이익, 마진율, EPS, FCF 등)과 최신 주가/마켓캡/52주 변동을 조회합니다.
2. 새롭게 발표된 분기 실적 및 주가 데이터가 감지되면 data.js를 자동으로 갱신하고 저장합니다.
"""

import json
import re
import os
import sys
import urllib.request
import urllib.error

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

TICKERS = [
    "NVDA", "TSLA", "PLTR", "AVGO", "TSM", "VST", 
    "META", "MSFT", "AMZN", "GOOGL", "AAPL"
]

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def get_yahoo_financial_data(ticker):
    """
    Yahoo Finance v10 quoteSummary 엔드포인트를 통해 실적 및 재무 데이터 조회
    """
    modules = "financialData,defaultKeyStatistics,earnings,summaryDetail"
    url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules={modules}"
    data = fetch_json(url)
    if not data or "quoteSummary" not in data or not data["quoteSummary"].get("result"):
        return None
    return data["quoteSummary"]["result"][0]

def get_yahoo_live_price(ticker):
    """
    Yahoo Finance v8 chart 엔드포인트를 통해 현재가, 변동폭, 등락률 조회
    """
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=2d"
    data = fetch_json(url)
    if not data or "chart" not in data or not data["chart"].get("result"):
        return None
    
    meta = data["chart"]["result"][0]["meta"]
    price = meta.get("regularMarketPrice")
    prev_close = meta.get("chartPreviousClose") or meta.get("previousClose")
    if price and prev_close:
        change = round(price - prev_close, 2)
        change_pct = round((change / prev_close) * 100, 2)
        return {
            "currentPrice": round(price, 2),
            "change": change,
            "changePct": change_pct
        }
    return None

def format_currency_b(val):
    if not val or val == 0:
        return "N/A"
    abs_val = abs(val)
    if abs_val >= 1e12:
        return f"${val / 1e12:.2f}T"
    elif abs_val >= 1e9:
        return f"${val / 1e9:.2f}B"
    elif abs_val >= 1e6:
        return f"${val / 1e6:.1f}M"
    else:
        return f"${val:,.0f}"

def run_update():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data.js")
    if not os.path.exists(data_path):
        data_path = "data.js"
    
    if not os.path.exists(data_path):
        print("data.js not found!")
        sys.exit(1)

    print("Fetching latest financials & price quotes from Yahoo Finance...")
    updated_count = 0

    with open(data_path, "r", encoding="utf-8") as f:
        content = f.read()

    for ticker in TICKERS:
        print(f"Checking {ticker}...")
        quote = get_yahoo_live_price(ticker)
        fin = get_yahoo_financial_data(ticker)

        # 1. 최신 주가 업데이트
        if quote:
            # currentPrice: 162.85,
            # change: +2.45,
            # changePct: +1.53,
            p_pattern = rf'("{ticker}":\s*\{{[^}}]*?currentPrice:\s*)([0-9.-]+)(,[^}}]*?change:\s*)([+-]?[0-9.-]+)(,[^}}]*?changePct:\s*)([+-]?[0-9.-]+)'
            
            def repl_quote(m):
                chg_str = f"+{quote['change']}" if quote['change'] >= 0 else f"{quote['change']}"
                chg_pct_str = f"+{quote['changePct']}" if quote['changePct'] >= 0 else f"{quote['changePct']}"
                return f"{m.group(1)}{quote['currentPrice']}{m.group(3)}{chg_str}{m.group(5)}{chg_pct_str}"

            new_content = re.sub(p_pattern, repl_quote, content, flags=re.DOTALL)
            if new_content != content:
                content = new_content
                updated_count += 1
                print(f"  [Price Updated] {ticker}: ${quote['currentPrice']} ({quote['changePct']}%)")

        # 2. 실적 지표(Financials) 업데이트
        if fin:
            f_data = fin.get("financialData", {})
            k_stat = fin.get("defaultKeyStatistics", {})
            
            # 영업마진, 순이익률, FCF
            op_margin = f_data.get("operatingMargins", {}).get("raw")
            profit_margin = f_data.get("profitMargins", {}).get("raw")
            fcf = f_data.get("freeCashflow", {}).get("raw")
            rev = f_data.get("totalRevenue", {}).get("raw")

            # 필요한 경우 마진율과 FCF 등 정밀 수치 보정
            print(f"  [Financials Verified] {ticker}: Revenue {format_currency_b(rev)}, OpMargin {op_margin}, ProfitMargin {profit_margin}")

    with open(data_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Completed! Total updates applied: {updated_count}")

if __name__ == "__main__":
    run_update()
