/**
 * AI 시대, 미국 주식의 판이 바뀐다 (저자: 김완수)
 * 통합 대시보드 및 주가 예측 웹 애플리케이션 (범용 검색 지원 버전)
 */

let currentTicker = "NVDA";
let stockChartInstance = null;

// 시뮬레이터 파라미터 (사용자 슬라이더 조절값)
let simParams = {
  us10y: MARKET_MACRO_DATA.us10yYield.current,
  oil: MARKET_MACRO_DATA.wtiOil.current,
  growthBoost: 0 // -20% ~ +30%
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. 검증된 시장 거시경제 DB 기준 즉시 렌더링 (깜빡임/수신불가 방지)
  initMacroHeader();
  initLiveMarketCardsWithVerifiedDB();
  initSearch();
  initTickerShortcuts();
  initWhatIfSimulator();
  initPortfolioCalculator();
  initChecklist();
  loadStockDashboard(currentTicker);
  // 2. 백그라운드 실시간 글로벌 시장 지표 연동 비동기 호출
  refreshLiveMarketData();
});

/**
 * ============================================================
 * 실시간 글로벌 시장 지표 Yahoo Finance 연동 엔진
 * 환율(USD/KRW), WTI 유가, 10년물 금리, S&P500, 나스닥, SOXL, TQQQ
 * ============================================================
 */

// Yahoo Finance v8 chart API를 CORS 프록시를 통해 호출
async function fetchYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const proxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];
  for (const proxyUrl of proxies) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(proxyUrl, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) continue;
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta || !meta.regularMarketPrice) continue;
      const price = meta.regularMarketPrice;
      const prev  = meta.chartPreviousClose || meta.previousClose || price;
      const chg   = price - prev;
      const chgP  = prev !== 0 ? (chg / prev) * 100 : 0;
      return {
        symbol,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(chg.toFixed(2)),
        changePct: parseFloat(chgP.toFixed(2)),
        currency: meta.currency || "USD"
      };
    } catch (e) { /* try next proxy */ }
  }

  // 환율의 경우 공식 환율 API(exchangerate-api.com)를 다이렉트 백업으로 호출
  if (symbol === "KRW=X") {
    try {
      const resEx = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { signal: AbortSignal.timeout(3000) });
      if (resEx.ok) {
        const jEx = await resEx.json();
        if (jEx && jEx.rates && jEx.rates.KRW) {
          const liveKrw = parseFloat(jEx.rates.KRW.toFixed(2));
          const prevKrw = MARKET_MACRO_DATA.exchangeRate.usdKrw || 1332.40;
          const chg = liveKrw - prevKrw;
          const chgPct = (chg / prevKrw) * 100;
          return {
            symbol: "KRW=X",
            price: liveKrw,
            change: parseFloat(chg.toFixed(2)),
            changePct: parseFloat(chgPct.toFixed(2)),
            currency: "KRW"
          };
        }
      }
    } catch (e) { /* fallback */ }
  }

  return null;
}

// 최초 화면 로드 시 검증된 시장 거시경제 DB 기준 즉시 렌더링 (깜빡임/수신불가 방지)
function initLiveMarketCardsWithVerifiedDB() {
  const m = MARKET_MACRO_DATA;
  if (!m) return;

  // 1. 환율
  const valKrw = document.getElementById("live-val-krw");
  const chgKrw = document.getElementById("live-chg-krw");
  const dotKrw = document.getElementById("live-dot-krw");
  if (valKrw) valKrw.innerText = `₩${m.exchangeRate.usdKrw.toLocaleString(undefined,{maximumFractionDigits:1})}`;
  if (chgKrw) {
    const isUp = m.exchangeRate.changePct >= 0;
    chgKrw.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
    chgKrw.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(m.exchangeRate.changePct).toFixed(2)}%`;
  }
  if (dotKrw) dotKrw.className = "fas fa-circle text-[6px] text-sky-400";

  // 2. 유가
  const valOil = document.getElementById("live-val-oil");
  const chgOil = document.getElementById("live-chg-oil");
  const dotOil = document.getElementById("live-dot-oil");
  if (valOil) valOil.innerText = `$${m.wtiOil.current.toFixed(2)}`;
  if (chgOil) {
    const isUp = m.wtiOil.changePct >= 0;
    chgOil.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
    chgOil.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(m.wtiOil.changePct).toFixed(2)}%`;
  }
  if (dotOil) dotOil.className = "fas fa-circle text-[6px] text-sky-400";

  // 3. 10년물 금리
  const val10y = document.getElementById("live-val-10y");
  const chg10y = document.getElementById("live-chg-10y");
  const dot10y = document.getElementById("live-dot-10y");
  if (val10y) val10y.innerText = `${m.us10yYield.current.toFixed(2)}%`;
  if (chg10y) {
    const isUp = m.us10yYield.change >= 0;
    chg10y.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-rose-400' : 'text-emerald-400'}`;
    chg10y.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(m.us10yYield.change).toFixed(2)}%p`;
  }
  if (dot10y) dot10y.className = "fas fa-circle text-[6px] text-sky-400";

  // 4. S&P500
  const valSp = document.getElementById("live-val-sp500");
  const chgSp = document.getElementById("live-chg-sp500");
  const dotSp = document.getElementById("live-dot-sp500");
  if (valSp) valSp.innerText = m.indices.sp500.current.toLocaleString(undefined,{maximumFractionDigits:2});
  if (chgSp) {
    const isUp = m.indices.sp500.changePct >= 0;
    chgSp.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
    chgSp.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(m.indices.sp500.changePct).toFixed(2)}%`;
  }
  if (dotSp) dotSp.className = "fas fa-circle text-[6px] text-sky-400";

  // 5. 나스닥
  const valNas = document.getElementById("live-val-nasdaq");
  const chgNas = document.getElementById("live-chg-nasdaq");
  const dotNas = document.getElementById("live-dot-nasdaq");
  if (valNas) valNas.innerText = m.indices.nasdaq.current.toLocaleString(undefined,{maximumFractionDigits:0});
  if (chgNas) {
    const isUp = m.indices.nasdaq.changePct >= 0;
    chgNas.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
    chgNas.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(m.indices.nasdaq.changePct).toFixed(2)}%`;
  }
  if (dotNas) dotNas.className = "fas fa-circle text-[6px] text-sky-400";

  // 6. SOXL
  const valSoxl = document.getElementById("live-val-soxl");
  const chgSoxl = document.getElementById("live-chg-soxl");
  const dotSoxl = document.getElementById("live-dot-soxl");
  if (valSoxl) valSoxl.innerText = `$${m.indices.soxl.current.toFixed(2)}`;
  if (chgSoxl) {
    const isUp = m.indices.soxl.changePct >= 0;
    chgSoxl.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
    chgSoxl.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(m.indices.soxl.changePct).toFixed(2)}%`;
  }
  if (dotSoxl) dotSoxl.className = "fas fa-circle text-[6px] text-sky-400";

  // 7. TQQQ
  const valTqqq = document.getElementById("live-val-tqqq");
  const chgTqqq = document.getElementById("live-chg-tqqq");
  const dotTqqq = document.getElementById("live-dot-tqqq");
  if (valTqqq) valTqqq.innerText = `$${m.indices.tqqq.current.toFixed(2)}`;
  if (chgTqqq) {
    const isUp = m.indices.tqqq.changePct >= 0;
    chgTqqq.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
    chgTqqq.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(m.indices.tqqq.changePct).toFixed(2)}%`;
  }
  if (dotTqqq) dotTqqq.className = "fas fa-circle text-[6px] text-sky-400";

  // 상태 표기
  const statusEl = document.getElementById("live-market-status");
  const sourceEl = document.getElementById("live-market-source");
  if (statusEl) {
    statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span><span>검증 DB 기준</span>`;
    statusEl.className = "inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono";
  }
  if (sourceEl) sourceEl.innerText = "📡 공식 시장 검증 DB 기준 (실시간 스트림 조회 중...)";
}

// 모든 시장 지표를 병렬로 일괄 조회
async function refreshLiveMarketData() {
  const statusEl = document.getElementById("live-market-status");
  const sourceEl = document.getElementById("live-market-source");
  const timeEl   = document.getElementById("live-market-time");

  // 로딩 상태 표시
  if (statusEl) {
    statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span><span>연동 중...</span>`;
    statusEl.className = "inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono";
  }

  const symbols = {
    krw:    "KRW=X",
    oil:    "CL=F",
    tnx:    "^TNX",
    sp500:  "^GSPC",
    nasdaq: "^IXIC",
    soxl:   "SOXL",
    tqqq:   "TQQQ"
  };

  // 병렬 호출
  const results = {};
  const promises = Object.entries(symbols).map(async ([key, sym]) => {
    results[key] = await fetchYahooQuote(sym);
  });
  await Promise.allSettled(promises);

  const now = new Date().toLocaleTimeString("ko-KR", { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  let successCount = 0;

  // 각 카드 업데이트 헬퍼
  function updateCard(key, formatValue, dotId, dbFallback) {
    const data = results[key];
    const dot = document.getElementById(dotId);
    const valEl = document.getElementById(`live-val-${key}`);
    const chgEl = document.getElementById(`live-chg-${key}`);

    if (data) {
      if (dot) dot.className = "fas fa-circle text-[6px] text-emerald-400 animate-pulse";
      successCount++;
      if (valEl) valEl.innerText = formatValue(data);
      if (chgEl) {
        const isUp = data.changePct >= 0;
        chgEl.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
        chgEl.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(data.changePct).toFixed(2)}%`;
      }
      return true;
    } else if (dbFallback) {
      // 프록시 일시 장애 시 신뢰할 수 있는 최근 검증 시장 DB 종가 기준으로 복원
      if (dot) dot.className = "fas fa-circle text-[6px] text-sky-400";
      if (valEl) valEl.innerText = dbFallback.val;
      if (chgEl) {
        const isUp = dbFallback.changePct >= 0;
        chgEl.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`;
        chgEl.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(dbFallback.changePct).toFixed(2)}%`;
      }
      return false;
    } else {
      if (dot) {
        dot.className = "fas fa-exclamation-circle text-[8px] text-rose-500";
        dot.title = "실시간 데이터 수신 불가 (임의 데이터 미출력)";
      }
      if (valEl) valEl.innerHTML = `<span class="text-xs text-rose-400 font-medium">수신 불가</span>`;
      if (chgEl) {
        chgEl.className = "text-[10px] text-slate-500 font-normal mt-0.5";
        chgEl.innerText = "데이터 없음";
      }
      return false;
    }
  }

  const m = MARKET_MACRO_DATA;

  // 1. 환율
  updateCard("krw", d => `₩${d.price.toLocaleString(undefined,{maximumFractionDigits:1})}`, "live-dot-krw", {
    val: `₩${m.exchangeRate.usdKrw.toLocaleString(undefined,{maximumFractionDigits:1})}`,
    changePct: m.exchangeRate.changePct
  });
  if (results.krw) {
    MARKET_MACRO_DATA.exchangeRate.usdKrw = results.krw.price;
    MARKET_MACRO_DATA.exchangeRate.changePct = results.krw.changePct;
    initMacroHeader();
  }

  // 2. WTI 유가
  updateCard("oil", d => `$${d.price.toFixed(2)}`, "live-dot-oil", {
    val: `$${m.wtiOil.current.toFixed(2)}`,
    changePct: m.wtiOil.changePct
  });
  if (results.oil) {
    MARKET_MACRO_DATA.wtiOil.current = results.oil.price;
    MARKET_MACRO_DATA.wtiOil.changePct = results.oil.changePct;
  }

  // 3. 10년물 금리
  const valEl10y = document.getElementById("live-val-10y");
  const chgEl10y = document.getElementById("live-chg-10y");
  const dot10y   = document.getElementById("live-dot-10y");

  if (results.tnx) {
    const yieldVal = results.tnx.price > 20 ? results.tnx.price / 10 : results.tnx.price;
    if (valEl10y) valEl10y.innerText = `${yieldVal.toFixed(2)}%`;
    if (chgEl10y) {
      const isUp = results.tnx.changePct >= 0;
      chgEl10y.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-rose-400' : 'text-emerald-400'}`;
      chgEl10y.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(results.tnx.changePct).toFixed(2)}%`;
    }
    if (dot10y) dot10y.className = "fas fa-circle text-[6px] text-emerald-400 animate-pulse";
    MARKET_MACRO_DATA.us10yYield.current = parseFloat(yieldVal.toFixed(2));
    MARKET_MACRO_DATA.us10yYield.change = results.tnx.change;
    successCount++;
    initMacroHeader();
  } else {
    // 검증 DB 기준 복원
    if (dot10y) dot10y.className = "fas fa-circle text-[6px] text-sky-400";
    if (valEl10y) valEl10y.innerText = `${m.us10yYield.current.toFixed(2)}%`;
    if (chgEl10y) {
      const isUp = m.us10yYield.change >= 0;
      chgEl10y.className = `text-[11px] font-semibold mt-0.5 ${isUp ? 'text-rose-400' : 'text-emerald-400'}`;
      chgEl10y.innerText = `${isUp ? '▲ +' : '▼ '}${Math.abs(m.us10yYield.change).toFixed(2)}%p`;
    }
  }

  // 4. S&P 500
  updateCard("sp500", d => d.price.toLocaleString(undefined,{maximumFractionDigits:2}), "live-dot-sp500", {
    val: m.indices.sp500.current.toLocaleString(undefined,{maximumFractionDigits:2}),
    changePct: m.indices.sp500.changePct
  });
  if (results.sp500) MARKET_MACRO_DATA.indices.sp500.current = results.sp500.price;

  // 5. 나스닥 종합
  updateCard("nasdaq", d => d.price.toLocaleString(undefined,{maximumFractionDigits:0}), "live-dot-nasdaq", {
    val: m.indices.nasdaq.current.toLocaleString(undefined,{maximumFractionDigits:0}),
    changePct: m.indices.nasdaq.changePct
  });
  if (results.nasdaq) MARKET_MACRO_DATA.indices.nasdaq.current = results.nasdaq.price;

  // 6. SOXL
  updateCard("soxl", d => `$${d.price.toFixed(2)}`, "live-dot-soxl", {
    val: `$${m.indices.soxl.current.toFixed(2)}`,
    changePct: m.indices.soxl.changePct
  });
  if (results.soxl) MARKET_MACRO_DATA.indices.soxl.current = results.soxl.price;

  // 7. TQQQ
  updateCard("tqqq", d => `$${d.price.toFixed(2)}`, "live-dot-tqqq", {
    val: `$${m.indices.tqqq.current.toFixed(2)}`,
    changePct: m.indices.tqqq.changePct
  });
  if (results.tqqq) MARKET_MACRO_DATA.indices.tqqq.current = results.tqqq.price;

  // 최종 상태 업데이트
  if (successCount >= 7) {
    if (statusEl) {
      statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span><span>실시간 연동 완료 (7/7)</span>`;
      statusEl.className = "inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono";
    }
    if (sourceEl) sourceEl.innerText = `📡 Yahoo Finance 실시간 시세 연동 완료 (모든 지표 수신)`;
  } else if (successCount > 0) {
    if (statusEl) {
      statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>실시간 연동 (${successCount}/7)</span>`;
      statusEl.className = "inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono";
    }
    if (sourceEl) sourceEl.innerText = `📡 실시간 연동 성공 (${successCount}/7 지표) · 나머지 지표는 검증 시장 DB 기준 표시`;
  } else {
    if (statusEl) {
      statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span><span>검증 DB 기준</span>`;
      statusEl.className = "inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono";
    }
    if (sourceEl) sourceEl.innerText = "📡 공식 시장 검증 DB 기준 표시 중 (원격 프록시 지연 시 안전 모드 가동)";
  }
  if (timeEl) timeEl.innerText = `마지막 갱신: ${now}`;
}
// window에 노출 (HTML onclick에서 호출)
window.refreshLiveMarketData = refreshLiveMarketData;

/**
 * 상단 거시경제 헤더 바 초기화
 */
function initMacroHeader() {
  const macro = MARKET_MACRO_DATA;
  
  // 환율
  const elExchange = document.getElementById("macro-exchange");
  if (elExchange) {
    const exChgPct = macro.exchangeRate.changePct;
    const exColor = exChgPct >= 0 ? 'text-emerald-400' : 'text-rose-400';
    elExchange.innerHTML = `
      <div class="flex items-center space-x-1">
        <span class="text-xs text-slate-400">USD/KRW</span>
        <span class="font-bold text-sm text-slate-100">${macro.exchangeRate.usdKrw.toLocaleString(undefined,{maximumFractionDigits:1})}원</span>
        <span class="text-xs ${exColor} font-semibold">${exChgPct >= 0 ? '+' : ''}${exChgPct.toFixed(2)}%</span>
      </div>
    `;
  }

  // 10년물 국채 금리
  const elYield = document.getElementById("macro-us10y");
  if (elYield) {
    elYield.innerHTML = `
      <div class="flex items-center space-x-1">
        <span class="text-xs text-slate-400">美 10년물 금리</span>
        <span class="font-bold text-sm text-amber-300">${macro.us10yYield.current}%</span>
        <span class="text-xs ${macro.us10yYield.change >= 0 ? 'text-rose-400' : 'text-emerald-400'} font-semibold">
          ${macro.us10yYield.change >= 0 ? '▲' : '▼'}${Math.abs(macro.us10yYield.change)}%p
        </span>
      </div>
    `;
  }

  // 연준 기준금리
  const elFed = document.getElementById("macro-fed");
  if (elFed) {
    elFed.innerHTML = `
      <div class="flex items-center space-x-1">
        <span class="text-xs text-slate-400">연준 기준금리</span>
        <span class="font-bold text-sm text-blue-300">${macro.fedRate.current}</span>
      </div>
    `;
  }

  // WTI 유가
  const elOil = document.getElementById("macro-oil");
  if (elOil) {
    const oilChg = macro.wtiOil.changePct;
    const oilColor = oilChg >= 0 ? 'text-rose-400' : 'text-emerald-400'; // 유가 상승=경고
    elOil.innerHTML = `
      <div class="flex items-center space-x-1">
        <span class="text-xs text-slate-400">WTI 유가</span>
        <span class="font-bold text-sm text-slate-100">$${macro.wtiOil.current}</span>
        <span class="text-xs ${oilColor} font-semibold">${oilChg >= 0 ? '+' : ''}${oilChg}%</span>
      </div>
    `;
  }

  // 공포 & 탐욕 지수
  const elFearGreed = document.getElementById("macro-fear-greed");
  if (elFearGreed) {
    const fg = macro.fearGreedIndex;
    let badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    if (fg.score <= 24) badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse";
    else if (fg.score >= 75) badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

    elFearGreed.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xs text-slate-400">공포&탐욕 지수</span>
        <div class="flex items-center space-x-1 px-2 py-0.5 rounded border ${badgeColor}">
          <span class="font-black text-sm">${fg.score}</span>
          <span class="text-xs font-medium">(${fg.rating})</span>
        </div>
        ${fg.score <= 25 ? '<span class="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">12장 분할매수 신호!</span>' : ''}
      </div>
    `;
  }
}

/**
 * 기업명 검색 및 자동완성 (어떤 기업이든 즉각 분석 지원)
 */
function initSearch() {
  const input = document.getElementById("stock-search-input");
  const suggestionsBox = document.getElementById("search-suggestions");
  const searchBtn = document.getElementById("search-btn");

  const filterStocks = (query) => {
    if (!query || query.trim() === "") return [];
    const q = query.trim().toLowerCase();
    
    // 1. 기존 DB 매칭
    const matches = Object.values(STOCKS_DATABASE).filter(s => 
      s.ticker.toLowerCase().includes(q) ||
      s.nameKo.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q)
    );

    // 2. 한글 매핑 사전에 있는 경우 추가 매칭
    for (const [kName, tVal] of Object.entries(KOREAN_TICKER_MAP)) {
      if (kName.toLowerCase().includes(q) || q.includes(kName.toLowerCase())) {
        if (!matches.some(m => m.ticker === tVal)) {
          const sObj = STOCKS_DATABASE[tVal] || lookupOrGenerateStock(kName);
          if (sObj && !matches.some(m => m.ticker === sObj.ticker)) {
            matches.push(sObj);
          }
        }
      }
    }

    return matches;
  };

  const renderSuggestions = (query, matches) => {
    if (!query || query.trim() === "") {
      suggestionsBox.classList.add("hidden");
      return;
    }

    const trimmedQ = query.trim();
    let html = `
      <!-- 즉석 동적 분석 실행 옵션 -->
      <div class="px-4 py-3 bg-gradient-to-r from-sky-950/80 to-slate-900 hover:from-sky-900/90 hover:to-slate-800 cursor-pointer flex items-center justify-between border-b border-sky-800/40 transition"
           onclick="handleSearchSubmit('${trimmedQ.replace(/'/g, "\\'")}')">
        <div class="flex items-center space-x-2.5">
          <span class="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs">
            <i class="fas fa-wand-magic-sparkles"></i>
          </span>
          <div>
            <span class="text-xs text-sky-300 font-bold block">'${trimmedQ}' 실시간 펀더멘털 & 주가 예측 분석</span>
            <span class="text-[10px] text-slate-400">책의 5단계 분석 및 금리·유가·순수익률 실시간 대조</span>
          </div>
        </div>
        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-sky-600 text-white">즉시 분석</span>
      </div>
    `;

    if (matches.length > 0) {
      html += matches.map(s => `
        <div class="px-4 py-3 hover:bg-slate-700/60 cursor-pointer flex items-center justify-between border-b border-slate-700/40 last:border-none transition"
             onclick="selectStock('${s.ticker}')">
          <div class="flex items-center space-x-3">
            <span class="font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800 text-xs">${s.ticker}</span>
            <span class="font-semibold text-slate-100 text-sm">${s.nameKo}</span>
            <span class="text-xs text-slate-400">${s.nameEn}</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-bold text-slate-200">$${s.currentPrice.toFixed(2)}</span>
            <span class="text-xs block ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium">
              ${s.change >= 0 ? '+' : ''}${s.changePct}%
            </span>
          </div>
        </div>
      `).join("");
    }

    suggestionsBox.innerHTML = html;
    suggestionsBox.classList.remove("hidden");
  };

  input.addEventListener("input", (e) => {
    const q = e.target.value;
    const matches = filterStocks(q);
    renderSuggestions(q, matches);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(input.value);
    }
  });

  searchBtn.addEventListener("click", () => {
    handleSearchSubmit(input.value);
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.add("hidden");
    }
  });
}

/**
 * 사용자가 입력한 검색어에 대해 즉각 분석 제출 처리 (철저한 데이터 검증 원칙 준수)
 */
async function handleSearchSubmit(query) {
  if (!query || query.trim() === "") return;
  const rawQ = query.trim();

  // 1. 기존 DB에 등록된 기업인지 확인
  let stock = lookupStock(rawQ);

  if (stock) {
    currentTicker = stock.ticker;
    document.getElementById("stock-search-input").value = "";
    document.getElementById("search-suggestions").classList.add("hidden");
    loadStockDashboard(stock.ticker);
    showAnalysisNotice(stock.nameKo, stock.ticker, stock.sector);
    return;
  }

  // 2. DB에 없다면 실시간 Yahoo Finance로 실제 존재하는 종목인지 확인
  const inputEl = document.getElementById("stock-search-input");
  if (inputEl) inputEl.value = "";
  document.getElementById("search-suggestions").classList.add("hidden");

  // 티커 심볼 유추 (한글 매핑 또는 영문 대문자)
  let sym = KOREAN_TICKER_MAP[rawQ.toLowerCase()] || KOREAN_TICKER_MAP[rawQ];
  if (!sym && /^[A-Za-z0-9^.=_-]{1,10}$/.test(rawQ)) {
    sym = rawQ.toUpperCase();
  }

  if (sym) {
    showNoticeToast("조회 중", `'${rawQ}' 실시간 데이터 조회 중...`, "info");
    const live = await fetchRealtimeStockQuote(sym);
    if (live && live.currentPrice) {
      // 실시간 데이터가 실제로 존재하는 경우에만 프로필 구성
      const realStock = {
        ticker: live.ticker,
        nameKo: rawQ,
        nameEn: `${live.ticker} Corp.`,
        sector: "실시간 연동 종목",
        chapter: "실시간 시장 시세 조회",
        authorPortfolioShare: "실시간 시장 데이터 연동",
        currentPrice: live.currentPrice,
        change: live.change,
        changePct: live.changePct,
        marketCap: "실시간 연동",
        peRatio: "N/A",
        forwardPE: "N/A",
        week52High: live.week52High || live.currentPrice,
        week52Low: live.week52Low || live.currentPrice,
        targetPriceBase: parseFloat((live.currentPrice * 1.15).toFixed(2)),
        targetPriceBull: parseFloat((live.currentPrice * 1.30).toFixed(2)),
        targetPriceBear: parseFloat((live.currentPrice * 0.85).toFixed(2)),
        priceDriver: "실시간 시장 수급 및 실적 변동성",
        realHistory: live.realHistory,
        financials: {
          revenue: "공시 데이터 없음",
          revenueYoY: "--",
          operatingIncome: "공시 데이터 없음",
          operatingMargin: "--",
          netIncome: "공시 데이터 없음",
          netMargin: "--",
          eps: "N/A",
          epsConsensus: "N/A",
          epsSurprise: "미분석 종목",
          operatingCashFlow: "공시 데이터 없음",
          freeCashFlow: "공시 데이터 없음",
          guidance: "별도 실적 공시 확인 필요",
          capEx: "공시 데이터 없음",
          datacenterRev: "데이터 없음"
        },
        investmentAnalysis: {
          thesis: `'${live.ticker}' 종목은 실시간 시세가 조회되었으나, 책 핵심 분석 기업 DB에 등록되지 않은 종목입니다. 허위 정보를 방지하기 위해 임의의 가상 재무제표나 가짜 차트를 생성하지 않습니다.`,
          strengths: ["실시간 주가 데이터 수신 성공"],
          keyRisks: ["검증된 재무 분석 보고서 부재", "자체 공시 및 사업보고서 직접 확인 권고"],
          fiveStepScore: {
            moatScore: "--",
            financialScore: "--",
            macroResilienceScore: "--",
            valuationScore: "--",
            finalAction: "자체 조사 필요",
            actionBadge: "NEUTRAL",
            authorComment: "책 12대 핵심 분석 종목 외의 기업은 반드시 DART/SEC 공시와 FCF를 직접 검증하시기 바랍니다."
          }
        },
        news: []
      };

      STOCKS_DATABASE[live.ticker] = realStock;
      currentTicker = live.ticker;
      loadStockDashboard(live.ticker);
      showAnalysisNotice(realStock.nameKo, realStock.ticker, realStock.sector);
      return;
    }
  }

  // 3. 관련 데이터를 못 갖고 오는 경우: 임의로 데이터를 만들지 않고 못 갖고 온다고 표시!
  showSearchErrorNotice(rawQ);
}

function selectStock(ticker) {
  const stock = STOCKS_DATABASE[ticker] || lookupStock(ticker);
  if (stock) {
    currentTicker = stock.ticker;
    document.getElementById("stock-search-input").value = "";
    document.getElementById("search-suggestions").classList.add("hidden");
    loadStockDashboard(stock.ticker);
  } else {
    showSearchErrorNotice(ticker);
  }
}

/**
 * 데이터 수신 실패 시 안내 알림 토스트 (임의 가상 데이터 생성 차단 원칙)
 */
function showSearchErrorNotice(rawQ) {
  let toast = document.getElementById("search-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "search-toast";
    document.body.appendChild(toast);
  }
  toast.className = "fixed bottom-5 right-5 z-50 bg-slate-900 border border-rose-500/50 shadow-2xl rounded-2xl p-4 max-w-sm transition-all duration-300 transform translate-y-0";

  toast.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0 text-sm">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div>
        <div class="flex items-center space-x-1.5">
          <span class="font-bold text-white text-sm">'${rawQ}' 데이터 수신 불가</span>
          <span class="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-semibold">조회 실패</span>
        </div>
        <p class="text-xs text-slate-300 mt-1 leading-tight">
          거래소 API 응답이 없거나 관련 거래 데이터를 가져올 수 없습니다. 원칙에 따라 임의의 가상 데이터를 생성하지 않고 조회를 중단했습니다. 올바른 종목명 또는 티커(예: NVDA, TSLA, AAPL 등)를 확인해주세요.
        </p>
      </div>
    </div>
  `;

  toast.classList.remove("hidden", "opacity-0");
  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 4500);
}

function showNoticeToast(title, msg, type) {
  let toast = document.getElementById("search-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "search-toast";
    document.body.appendChild(toast);
  }
  toast.className = "fixed bottom-5 right-5 z-50 bg-slate-900 border border-sky-500/50 shadow-2xl rounded-2xl p-4 max-w-sm transition-all duration-300 transform translate-y-0";

  toast.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 text-sm">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <div>
        <span class="font-bold text-white text-sm">${title}</span>
        <p class="text-xs text-slate-300 mt-0.5 leading-tight">${msg}</p>
      </div>
    </div>
  `;
  toast.classList.remove("hidden", "opacity-0");
}

/**
 * 분석 완료 안내 알림 토스트
 */
function showAnalysisNotice(nameKo, ticker, sector) {
  let toast = document.getElementById("search-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "search-toast";
    toast.className = "fixed bottom-5 right-5 z-50 bg-slate-900 border border-sky-500/50 shadow-2xl rounded-2xl p-4 max-w-sm transition-all duration-300 transform translate-y-0";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 text-sm">
        <i class="fas fa-chart-pie"></i>
      </div>
      <div>
        <div class="flex items-center space-x-1.5">
          <span class="font-bold text-white text-sm">${nameKo} (${ticker})</span>
          <span class="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-semibold">분석 완료</span>
        </div>
        <p class="text-xs text-slate-300 mt-1 leading-tight">
          전자책 프레임워크와 실시간 거시경제(금리 ${MARKET_MACRO_DATA.us10yYield.current}%, 유가 $${MARKET_MACRO_DATA.wtiOil.current})를 대조한 주가 예측 차트가 생성되었습니다.
        </p>
      </div>
    </div>
  `;

  toast.classList.remove("hidden", "opacity-0");
  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 4500);
}

/**
 * 핫 티커 버튼 초기화 (전자책 주요 다룸 종목들 및 섹터별 대표주)
 * - 현 시점 주가 상승 가능성 1위: META (골드 앰버 하이라이트)
 * - 6개월 내 가장 가파른 급등 1위: VST (네온 푸시아/로즈 하이라이트)
 */
function initTickerShortcuts() {
  const container = document.getElementById("hot-tickers-container");
  if (!container) return;
  const popularTickers = ["NVDA", "TSLA", "PLTR", "META", "VST", "AVGO", "TSM", "MSFT", "AMZN", "GOOGL", "AAPL", "SPCX"];
  
  container.innerHTML = popularTickers.map(t => {
    const s = STOCKS_DATABASE[t] || lookupOrGenerateStock(t);
    const isSelected = (t === currentTicker);

    // 1. 현 시점 상승 가능성 1위: META (책 7장 밸류에이션 최상위 + FCF 폭발)
    if (t === "META") {
      return `
        <button onclick="selectStock('${t}')" 
                class="ticker-pill relative group px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-300 transform hover:scale-105
                       ${isSelected 
                         ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 ring-2 ring-yellow-200 shadow-xl shadow-amber-500/50' 
                         : 'bg-gradient-to-r from-amber-500/25 to-yellow-600/30 text-amber-200 border-2 border-amber-400/80 hover:bg-amber-500/40 shadow-lg shadow-amber-500/20'}">
          <span class="flex items-center space-x-1.5">
            <span class="text-amber-300 animate-bounce text-[11px]">👑</span>
            <span>${s.nameKo}</span>
            <span class="text-[10px] opacity-80 font-mono">(${t})</span>
            <span class="ml-1 text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-extrabold tracking-tight">현시점 상승 1위</span>
          </span>
        </button>
      `;
    }

    // 2. 6개월 안에 가장 가파르게 상승할 기업: VST (책 8장 전력 폭증 슈퍼사이클 최대 잭팟)
    if (t === "VST") {
      return `
        <button onclick="selectStock('${t}')" 
                class="ticker-pill relative group px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-300 transform hover:scale-105
                       ${isSelected 
                         ? 'bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white ring-2 ring-pink-300 shadow-xl shadow-fuchsia-500/50' 
                         : 'bg-gradient-to-r from-fuchsia-950/60 to-rose-950/60 text-fuchsia-200 border-2 border-fuchsia-500/80 hover:border-pink-400 shadow-lg shadow-fuchsia-500/20'}">
          <span class="flex items-center space-x-1.5">
            <span class="text-rose-400 animate-pulse text-[11px]">🚀</span>
            <span>${s.nameKo}</span>
            <span class="text-[10px] opacity-80 font-mono">(${t})</span>
            <span class="ml-1 text-[10px] bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white px-1.5 py-0.2 rounded-full font-extrabold tracking-tight animate-pulse">6개월 급등 1위</span>
          </span>
        </button>
      `;
    }

    // 일반 종목
    return `
      <button onclick="selectStock('${t}')" 
              class="ticker-pill px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all
                     ${isSelected 
                       ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-2 ring-sky-300' 
                       : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'}">
        <span>${s.nameKo}</span>
        <span class="opacity-75 text-[11px] font-mono">(${t})</span>
      </button>
    `;
  }).join("");
}

/**
 * 메인 대시보드 렌더링
 */
/**
 * Yahoo Finance 실시간 주가 및 실제 차트 데이터 비동기 조회
 * 브라우저 환경에서 다중 CORS 프록시를 통해 최신 주가와 실제 일봉을 안전하게 가져옵니다.
 */
async function fetchRealtimeStockQuote(ticker) {
  if (!ticker) return null;
  const cleanTicker = ticker.toUpperCase().trim();
  
  // Yahoo Finance v8 chart API (최근 1년 일봉 데이터 - 3개월 및 6개월 전 주가 비교용)
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}?interval=1d&range=1y`;
  
  const proxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5초 타임아웃
      
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) continue;
      const json = await res.json();
      const chartResult = json?.chart?.result?.[0];
      if (!chartResult || !chartResult.meta) continue;

      const meta = chartResult.meta;
      const currentPrice = meta.regularMarketPrice;
      if (!currentPrice || isNaN(currentPrice)) continue;

      const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
      const change = currentPrice - prevClose;
      const changePct = (change / prevClose) * 100;

      // 실제 일봉 종가 히스토리 추출
      const timestamps = chartResult.timestamp || [];
      const quotes = chartResult.indicators?.quote?.[0]?.close || [];
      const realHistory = [];

      for (let i = 0; i < timestamps.length; i++) {
        if (quotes[i] !== null && quotes[i] !== undefined && !isNaN(quotes[i])) {
          const d = new Date(timestamps[i] * 1000);
          const dateStr = d.toISOString().split("T")[0];
          realHistory.push({
            date: dateStr,
            price: parseFloat(quotes[i].toFixed(2))
          });
        }
      }

      return {
        ticker: cleanTicker,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePct: parseFloat(changePct.toFixed(2)),
        week52High: meta.fiftyTwoWeekHigh ? parseFloat(meta.fiftyTwoWeekHigh.toFixed(2)) : undefined,
        week52Low: meta.fiftyTwoWeekLow ? parseFloat(meta.fiftyTwoWeekLow.toFixed(2)) : undefined,
        currency: meta.currency || "USD",
        realHistory: realHistory.length > 5 ? realHistory : null,
        source: "Yahoo Finance (실시간 연동)",
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    } catch (e) {
      console.warn(`[LiveQuote] Proxy ${proxyUrl} failed:`, e.message);
    }
  }

  return null;
}

/**
 * 선택된 기업 대시보드 로드 (검증 DB 기준 즉시 렌더링 후 실시간 API로 부드럽게 갱신)
 */
function loadStockDashboard(ticker) {
  let stock = STOCKS_DATABASE[ticker];
  if (!stock) {
    stock = lookupOrGenerateStock(ticker);
  }
  if (!stock) return;

  currentTicker = stock.ticker;
  initTickerShortcuts();

  // 헤더 요약 정보 렌더링 함수
  function updateHeaderUI(isLive, timeLabel) {
    document.getElementById("stock-name-ko").innerText = stock.nameKo;
    document.getElementById("stock-name-en").innerText = `${stock.nameEn} (${stock.ticker})`;
    document.getElementById("stock-sector-badge").innerText = stock.sector;
    document.getElementById("stock-chapter-badge").innerText = stock.chapter;
    document.getElementById("stock-portfolio-share").innerText = stock.authorPortfolioShare;

    // 특별 랭킹 뱃지 업데이트 (META: 현시점 상승 1위, VST: 6개월 급등 1위)
    const elSpecialRank = document.getElementById("stock-special-rank-badge");
    if (elSpecialRank) {
      if (stock.ticker === "META") {
        elSpecialRank.innerHTML = `
          <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/40 ring-1 ring-yellow-200">
            <span>👑</span>
            <span>현 시점 상승 가능성 1위 종목</span>
            <span class="text-[10px] bg-slate-950/25 text-slate-950 px-1.5 py-0.5 rounded-full font-bold">책 7장 저평가 FCF 제왕</span>
          </span>
        `;
      } else if (stock.ticker === "VST") {
        elSpecialRank.innerHTML = `
          <span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white shadow-lg shadow-fuchsia-500/40 ring-1 ring-pink-300 animate-pulse">
            <span>🚀</span>
            <span>6개월 내 가장 가파른 급등 1위 종목</span>
            <span class="text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold">책 8장 전력 폭증 슈퍼사이클</span>
          </span>
        `;
      } else {
        elSpecialRank.innerHTML = "";
      }
    }

    // 실시간 연동 뱃지 업데이트
    const elLiveBadge = document.getElementById("stock-live-badge");
    const elPriceSource = document.getElementById("price-source-tag");
    if (isLive) {
      if (elLiveBadge) {
        elLiveBadge.innerHTML = `
          <span class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Yahoo Finance 실시간 연동</span>
          </span>
        `;
      }
      if (elPriceSource) {
        elPriceSource.innerText = `실시간 (${timeLabel})`;
        elPriceSource.className = "text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-mono";
      }
    } else {
      if (elLiveBadge) {
        elLiveBadge.innerHTML = `
          <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <i class="fas fa-check-circle text-sky-400 text-[10px] mr-1"></i>검증된 최신 종가 DB
          </span>
        `;
      }
      if (elPriceSource) {
        elPriceSource.innerText = "검증 DB 기준";
        elPriceSource.className = "text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono";
      }
    }

    document.getElementById("stock-current-price").innerText = `$${stock.currentPrice.toFixed(2)}`;
    const elPriceChange = document.getElementById("stock-price-change");
    elPriceChange.className = `text-sm font-semibold flex items-center space-x-1 ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    elPriceChange.innerHTML = `
      <span>${stock.change >= 0 ? '▲' : '▼'} $${Math.abs(stock.change).toFixed(2)}</span>
      <span>(${stock.change >= 0 ? '+' : ''}${stock.changePct.toFixed(2)}%)</span>
      <span class="text-xs text-slate-400 font-normal ml-2">${isLive ? '실시간 거래가' : '최근 종가'}</span>
    `;

    document.getElementById("val-market-cap").innerText = stock.marketCap;
    document.getElementById("val-pe").innerText = `${stock.peRatio}x`;
    document.getElementById("val-fpe").innerText = `${stock.forwardPE}x`;
    document.getElementById("val-52w").innerText = `$${stock.week52Low} ~ $${stock.week52High}`;

    // 목표주가 카드
    document.getElementById("target-base").innerText = `$${stock.targetPriceBase.toFixed(2)}`;
    document.getElementById("target-bull").innerText = `$${stock.targetPriceBull.toFixed(2)}`;
    document.getElementById("target-bear").innerText = `$${stock.targetPriceBear.toFixed(2)}`;
    
    const baseUpside = (((stock.targetPriceBase - stock.currentPrice) / stock.currentPrice) * 100).toFixed(1);
    document.getElementById("target-base-upside").innerText = `${baseUpside >= 0 ? '+' : ''}${baseUpside}% 예상`;
  }

  // 1단계: 검증된 최신 데이터베이스 기준으로 지연 없이 즉각 렌더링
  updateHeaderUI(false);
  renderFinancialCards(stock);
  renderStockPredictionChart(stock);
  renderFiveStepScorecard(stock);
  renderNewsFeed(stock);
  document.getElementById("checklist-stock-target").innerText = `${stock.nameKo} (${stock.ticker})`;

  // 2단계: 백그라운드에서 Yahoo Finance 실시간 시세 API 비동기 조회
  const targetTickerForFetch = stock.ticker;
  fetchRealtimeStockQuote(targetTickerForFetch).then(live => {
    // 사용자가 대기 도중 다른 종목을 누르지 않았을 때만 적용
    if (live && currentTicker === targetTickerForFetch) {
      stock.currentPrice = live.currentPrice;
      stock.change = live.change;
      stock.changePct = live.changePct;
      if (live.week52High) stock.week52High = live.week52High;
      if (live.week52Low) stock.week52Low = live.week52Low;
      if (live.realHistory) stock.realHistory = live.realHistory;

      // 목표주가도 실시간 변동폭에 맞춰 재계산
      stock.targetPriceBase = parseFloat((stock.currentPrice * 1.18).toFixed(2));
      stock.targetPriceBull = parseFloat((stock.currentPrice * 1.38).toFixed(2));
      stock.targetPriceBear = parseFloat((stock.currentPrice * 0.82).toFixed(2));

      // 헤더 및 차트 실시간 갱신
      updateHeaderUI(true, live.timestamp);
      renderStockPredictionChart(stock);
    }
  });
}

/**
 * 8대 실적 지표 & 기업 실제 순수익률 카드 렌더링
 */
function renderFinancialCards(stock) {
  const fin = stock.financials;
  const container = document.getElementById("financial-cards-grid");
  if (!container) return;

  const items = [
    {
      title: "① 분기 매출액 (Top-line)",
      val: fin.revenue,
      sub: `전년비(YoY) ${fin.revenueYoY}`,
      subColor: fin.revenueYoY.includes("+") ? "text-emerald-400" : "text-rose-400",
      icon: "fa-chart-line",
      note: "기업의 외형 성장 스케일 확인 (부록 B-1)"
    },
    {
      title: "② 영업이익 (Operating Income)",
      val: fin.operatingIncome,
      sub: `본업 마진율: ${fin.operatingMargin}`,
      subColor: "text-sky-400",
      icon: "fa-coins",
      note: "진짜 알짜배기 본업 펀더멘털 (부록 B-2)"
    },
    {
      title: "③ 실제 순수익률 (Net Margin)",
      val: fin.netIncome,
      sub: `순이익률: ${fin.netMargin}`,
      subColor: "text-amber-300 font-bold",
      icon: "fa-sack-dollar",
      note: "비용 차감 후 최종 순수익 퀄리티 (책 13장)"
    },
    {
      title: "④ 주당순이익 (EPS) & 컨센서스",
      val: fin.eps,
      sub: `컨센서스 대비: ${fin.epsSurprise}`,
      subColor: "text-emerald-400",
      icon: "fa-bullseye",
      note: `월가 예상(${fin.epsConsensus}) 상회 여부 (부록 B-4)`
    },
    {
      title: "⑤ 영업현금흐름 (OCF)",
      val: fin.operatingCashFlow,
      sub: "통장에 실제 꽂힌 영업 현금",
      subColor: "text-teal-400",
      icon: "fa-money-bill-transfer",
      note: "회계상 착시를 제거한 현금 체력 (부록 B-5)"
    },
    {
      title: "⑥ 잉여현금흐름 (FCF)",
      val: fin.freeCashFlow,
      sub: "CapEx 차감 후 진짜 알짜 현금",
      subColor: "text-purple-300 font-bold",
      icon: "fa-vault",
      note: "주주환원 및 신사업 실탄 (부록 B-6)"
    },
    {
      title: "⑦ 차기 가이던스 (Guidance)",
      val: "가이던스 상향",
      sub: fin.guidance,
      subColor: "text-emerald-400",
      icon: "fa-compass",
      note: "과거보다 미래를 먹고사는 핵심 나침반 (부록 B-7)"
    },
    {
      title: "⑧ 설비투자 (CapEx)",
      val: fin.capEx,
      sub: fin.datacenterRev,
      subColor: "text-slate-300",
      icon: "fa-server",
      note: "AI 인프라 확장 및 ROI 회수율 감시 (부록 B-8)"
    }
  ];

  container.innerHTML = items.map(item => `
    <div class="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 hover:border-slate-600 transition flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>${item.title}</span>
          <i class="fas ${item.icon} text-slate-500"></i>
        </div>
        <div class="text-xl font-bold text-slate-100 tracking-tight">${item.val}</div>
        <div class="text-xs ${item.subColor} mt-1 font-medium">${item.sub}</div>
      </div>
      <div class="text-[11px] text-slate-500 border-t border-slate-700/40 pt-2 mt-3">
        ${item.note}
      </div>
    </div>
  `).join("");
}

/**
 * 3개월 전 및 6개월 전 시점 대비 주가 등락률 UI 전광판 렌더링
 */
function renderPeriodComparisonUI(comparison) {
  const elDate3 = document.getElementById("cmp-3m-date");
  const elPrice3 = document.getElementById("cmp-3m-price");
  const elPct3 = document.getElementById("cmp-3m-pct");
  const elDiff3 = document.getElementById("cmp-3m-diff");

  const elDate6 = document.getElementById("cmp-6m-date");
  const elPrice6 = document.getElementById("cmp-6m-price");
  const elPct6 = document.getElementById("cmp-6m-pct");
  const elDiff6 = document.getElementById("cmp-6m-diff");
  const elSummary = document.getElementById("cmp-trend-summary");

  if (!comparison) {
    if (elDate3) elDate3.innerText = "(데이터 수신 불가)";
    if (elPrice3) elPrice3.innerText = "N/A";
    if (elPct3) {
      elPct3.className = "text-sm font-semibold text-slate-500 font-mono";
      elPct3.innerText = "데이터 없음";
    }
    if (elDiff3) {
      elDiff3.className = "text-[10px] text-slate-500 font-mono";
      elDiff3.innerText = "--";
    }

    if (elDate6) elDate6.innerText = "(데이터 수신 불가)";
    if (elPrice6) elPrice6.innerText = "N/A";
    if (elPct6) {
      elPct6.className = "text-sm font-semibold text-slate-500 font-mono";
      elPct6.innerText = "데이터 없음";
    }
    if (elDiff6) {
      elDiff6.className = "text-[10px] text-slate-500 font-mono";
      elDiff6.innerText = "--";
    }

    if (elSummary) {
      elSummary.innerHTML = `<span class="text-rose-400 font-semibold"><i class="fas fa-ban mr-1"></i>데이터를 불러올 수 없어 임의의 등락률 및 추세 진단을 생성하지 않습니다.</span>`;
    }
    return;
  }

  const p3 = comparison.threeMonths;
  const p6 = comparison.sixMonths;

  // 1. 3개월 전 대비 카드
  if (elDate3) elDate3.innerText = `(${p3.date})`;
  if (elPrice3) elPrice3.innerText = `$${p3.price.toFixed(2)}`;
  if (elPct3) {
    const isUp3 = p3.changePct >= 0;
    elPct3.className = `text-base sm:text-lg font-black font-mono tracking-tight ${isUp3 ? 'text-emerald-400' : 'text-rose-400'}`;
    elPct3.innerText = `${isUp3 ? '▲ +' : '▼ '}${p3.changePct.toFixed(1)}%`;
  }
  if (elDiff3) {
    const isUp3 = p3.change >= 0;
    elDiff3.className = `text-[10px] font-semibold font-mono ${isUp3 ? 'text-emerald-400/80' : 'text-rose-400/80'}`;
    elDiff3.innerText = `${isUp3 ? '+' : ''}$${p3.change.toFixed(2)}`;
  }

  // 2. 6개월 전 대비 카드
  if (elDate6) elDate6.innerText = `(${p6.date})`;
  if (elPrice6) elPrice6.innerText = `$${p6.price.toFixed(2)}`;
  if (elPct6) {
    const isUp6 = p6.changePct >= 0;
    elPct6.className = `text-base sm:text-lg font-black font-mono tracking-tight ${isUp6 ? 'text-emerald-400' : 'text-rose-400'}`;
    elPct6.innerText = `${isUp6 ? '▲ +' : '▼ '}${p6.changePct.toFixed(1)}%`;
  }
  if (elDiff6) {
    const isUp6 = p6.change >= 0;
    elDiff6.className = `text-[10px] font-semibold font-mono ${isUp6 ? 'text-emerald-400/80' : 'text-rose-400/80'}`;
    elDiff6.innerText = `${isUp6 ? '+' : ''}$${p6.change.toFixed(2)}`;
  }

  // 3. 중단기 수익률 추세 진단 코멘트
  if (elSummary) {
    if (p3.changePct > 0 && p6.changePct > 0) {
      if (p3.changePct >= (p6.changePct / 2)) {
        elSummary.innerHTML = `<span class="text-emerald-300">🚀 3M(+${p3.changePct}%) · 6M(+${p6.changePct}%): 최근 3개월간 상승 탄력 가속화 중!</span>`;
      } else {
        elSummary.innerHTML = `<span class="text-sky-300">📈 3M(+${p3.changePct}%) · 6M(+${p6.changePct}%): 6개월 중장기 견고한 우상향 추세 유지</span>`;
      }
    } else if (p3.changePct < 0 && p6.changePct > 0) {
      elSummary.innerHTML = `<span class="text-amber-300">⚠️ 6M(+${p6.changePct}%) 중기 상승세 속 최근 3M(${p3.changePct}%) 단기 숨고르기/눌림목</span>`;
    } else if (p3.changePct > 0 && p6.changePct < 0) {
      elSummary.innerHTML = `<span class="text-emerald-300">🔄 6M(${p6.changePct}%) 부진 딛고 최근 3M(+${p3.changePct}%) 강력한 반등 전환 성공</span>`;
    } else {
      elSummary.innerHTML = `<span class="text-rose-300">📉 3M(${p3.changePct}%) · 6M(${p6.changePct}%): 중단기 조정 지속, 공포지수 20 이하 분할 매수 타점 탐색</span>`;
    }
  }
}

/**
 * 실시간 주가 차트 vs 향후 예상 주가 차트 (다른 색상으로 명확히 구분 렌더링)
 */
function renderStockPredictionChart(stock) {
  const chartCanvas = document.getElementById("stock-prediction-chart");
  const errorPlaceholder = document.getElementById("chart-error-placeholder");
  const data = generateHistoricalAndFutureData(stock.ticker, stock);

  if (!data || !data.dates || data.dates.length === 0) {
    if (stockChartInstance) {
      stockChartInstance.destroy();
      stockChartInstance = null;
    }
    if (chartCanvas) chartCanvas.classList.add("hidden");
    if (errorPlaceholder) {
      errorPlaceholder.classList.remove("hidden");
      const errMsg = document.getElementById("chart-error-msg");
      if (errMsg) {
        errMsg.innerHTML = `'${stock.nameKo || stock.ticker}' 종목의 과거 거래 내역 및 실시간 주가 데이터를 불러올 수 없습니다.<br>원칙에 따라 임의의 가상 데이터를 생성하지 않고 차트 출력을 제한합니다.`;
      }
    }
    renderPeriodComparisonUI(null);
    return;
  }

  // 정상 데이터가 있는 경우 에러 숨기고 캔버스 표시
  if (errorPlaceholder) errorPlaceholder.classList.add("hidden");
  if (chartCanvas) chartCanvas.classList.remove("hidden");

  const ctx = chartCanvas.getContext("2d");

  // 3개월 전 / 6개월 전 비교 전광판 렌더링
  renderPeriodComparisonUI(data.comparison);

  // What-If 시뮬레이터 파라미터 적용 (금리 변동 & 유가 변동 & 성장률 조정치)
  const rateDelta = simParams.us10y - MARKET_MACRO_DATA.us10yYield.current;
  const rateDiscountFactor = 1 - (rateDelta * 0.14); // 금리 1%p 상승 시 미래가치 약 14% 압축
  const growthFactor = 1 + (simParams.growthBoost / 100);
  const totalMultiplier = rateDiscountFactor * growthFactor;

  const adjustedBase = data.predictedBase.map(v => v === null ? null : parseFloat((v * totalMultiplier).toFixed(2)));
  const adjustedBull = data.predictedBull.map(v => v === null ? null : parseFloat((v * totalMultiplier).toFixed(2)));
  const adjustedBear = data.predictedBear.map(v => v === null ? null : parseFloat((v * totalMultiplier).toFixed(2)));

  if (stockChartInstance) {
    stockChartInstance.destroy();
  }

  // 오늘 시점 기준선 인덱스
  const cutoff = data.cutoffIndex;
  const todayDate = data.dates[cutoff];

  stockChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.dates,
      datasets: [
        {
          label: "현재 실시간 주가 (과거~오늘)",
          data: data.actualPrices,
          borderColor: "#0ea5e9", // 스카이블루 실선
          backgroundColor: "rgba(14, 165, 233, 0.08)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.15,
          pointRadius: (ctx) => {
            const index = ctx.dataIndex;
            if (index === cutoff) return 7; // 오늘/현시점 강조 포인트
            if (data.comparison) {
              if (index === data.comparison.threeMonths.index) return 6; // 3개월 전 포인트
              if (index === data.comparison.sixMonths.index) return 6; // 6개월 전 포인트
            }
            return 0;
          },
          pointBackgroundColor: (ctx) => {
            const index = ctx.dataIndex;
            if (index === cutoff) return "#38bdf8"; // 스카이블루 (오늘)
            if (data.comparison) {
              if (index === data.comparison.threeMonths.index) return "#f59e0b"; // 앰버/황금 (3개월 전)
              if (index === data.comparison.sixMonths.index) return "#818cf8"; // 인디고/보라 (6개월 전)
            }
            return "#0ea5e9";
          },
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          order: 1
        },
        {
          label: "향후 예상 주가 (Base 기본 전망)",
          data: adjustedBase,
          borderColor: "#f59e0b", // 황금색 점선
          borderWidth: 2.5,
          borderDash: [6, 4],
          backgroundColor: "transparent",
          pointRadius: 0,
          tension: 0.2,
          order: 2
        },
        {
          label: "낙관 시나리오 (Bull - AI 폭발/성공)",
          data: adjustedBull,
          borderColor: "#10b981", // 에메랄드 그린 점선
          borderWidth: 2,
          borderDash: [4, 4],
          backgroundColor: "rgba(16, 185, 129, 0.04)",
          fill: "+1", // Bear 라인과 함께 영역 채우기
          pointRadius: 0,
          tension: 0.2,
          order: 3
        },
        {
          label: "보수 시나리오 (Bear - 고금리/CapEx회수지연)",
          data: adjustedBear,
          borderColor: "#f43f5e", // 로즈 레드 점선
          borderWidth: 2,
          borderDash: [4, 4],
          backgroundColor: "rgba(244, 63, 94, 0.04)",
          fill: false,
          pointRadius: 0,
          tension: 0.2,
          order: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: "#94a3b8",
            usePointStyle: true,
            boxWidth: 8,
            font: {
              size: 11,
              family: "'Pretendard', sans-serif"
            }
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          titleColor: "#f1f5f9",
          bodyColor: "#cbd5e1",
          borderColor: "rgba(51, 65, 85, 0.8)",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            title: (items) => {
              const d = items[0].label;
              const idx = items[0].dataIndex;
              if (idx === cutoff) return `📍 [오늘/현시점 실시간] ${d}`;
              if (data.comparison) {
                if (idx === data.comparison.threeMonths.index) return `📅 [3개월 전 시점] ${d}`;
                if (idx === data.comparison.sixMonths.index) return `📅 [6개월 전 시점] ${d}`;
              }
              return d > todayDate ? `🔮 [AI 미래 예측] ${d}` : `과거 거래일: ${d}`;
            },
            label: (item) => {
              if (item.raw === null || item.raw === undefined) return null;
              return ` ${item.dataset.label}: $${item.raw.toFixed(2)}`;
            },
            afterBody: (items) => {
              const item = items[0];
              const idx = item.dataIndex;
              if (data.comparison) {
                if (idx === data.comparison.threeMonths.index) {
                  const p = data.comparison.threeMonths;
                  return [
                    "",
                    `• 현시점 대비 등락폭: ${p.change >= 0 ? '+' : ''}$${p.change.toFixed(2)}`,
                    `• 현시점 대비 수익률: ${p.changePct >= 0 ? '+' : ''}${p.changePct.toFixed(1)}%`
                  ];
                }
                if (idx === data.comparison.sixMonths.index) {
                  const p = data.comparison.sixMonths;
                  return [
                    "",
                    `• 현시점 대비 등락폭: ${p.change >= 0 ? '+' : ''}$${p.change.toFixed(2)}`,
                    `• 현시점 대비 수익률: ${p.changePct >= 0 ? '+' : ''}${p.changePct.toFixed(1)}%`
                  ];
                }
                if (idx === cutoff) {
                  const p3 = data.comparison.threeMonths;
                  const p6 = data.comparison.sixMonths;
                  return [
                    "",
                    `• 3개월 전 대비: ${p3.changePct >= 0 ? '+' : ''}${p3.changePct.toFixed(1)}% (${p3.change >= 0 ? '+' : ''}$${p3.change.toFixed(2)})`,
                    `• 6개월 전 대비: ${p6.changePct >= 0 ? '+' : ''}${p6.changePct.toFixed(1)}% (${p6.change >= 0 ? '+' : ''}$${p6.change.toFixed(2)})`
                  ];
                }
              }
              if (item.label > todayDate) {
                return [
                  "",
                  `• 적용 10년물 금리: ${simParams.us10y.toFixed(2)}% (할인율 압박)`,
                  `• 실적 순수익률: ${stock.financials.netMargin}`
                ];
              }
              return [];
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: "rgba(51, 65, 85, 0.2)",
            drawBorder: false
          },
          ticks: {
            color: "#64748b",
            maxTicksLimit: 12,
            font: { size: 10 }
          }
        },
        y: {
          grid: {
            color: "rgba(51, 65, 85, 0.25)",
            drawBorder: false
          },
          ticks: {
            color: "#94a3b8",
            callback: (v) => `$${v}`,
            font: { size: 11 }
          }
        }
      }
    }
  });

  // 차트 안내 태그 업데이트
  const chartTag = document.getElementById("chart-cutoff-tag");
  if (chartTag) {
    chartTag.innerHTML = `
      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-950 text-sky-300 border border-sky-800">
        <span class="w-2 h-2 rounded-full bg-sky-400 inline-block mr-1.5 animate-pulse"></span>
        실시간 시세: $${stock.currentPrice}
      </span>
      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 ml-2">
        <span class="w-2 h-2 rounded-full bg-amber-400 inline-block mr-1.5"></span>
        1년 후 Base 예상: $${(stock.targetPriceBase * totalMultiplier).toFixed(2)}
      </span>
    `;
  }
}

/**
 * 김완수 저자의 5단계 투자 진단 스코어카드 렌더링 (본문 14장 & 부록 A/C 반영)
 */
function renderFiveStepScorecard(stock) {
  const sc = stock.bookAnalysis.fiveStepScore;
  const analysis = stock.bookAnalysis;

  document.getElementById("score-moat").innerText = `${sc.moatScore}/100`;
  document.getElementById("score-financial").innerText = `${sc.financialScore}/100`;
  document.getElementById("score-macro").innerText = `${sc.macroResilienceScore}/100`;
  document.getElementById("score-valuation").innerText = `${sc.valuationScore}/100`;

  // 프로그레스 바 너비 설정
  document.getElementById("bar-moat").style.width = `${sc.moatScore}%`;
  document.getElementById("bar-financial").style.width = `${sc.financialScore}%`;
  document.getElementById("bar-macro").style.width = `${sc.macroResilienceScore}%`;
  document.getElementById("bar-valuation").style.width = `${sc.valuationScore}%`;

  // 종합 판정 및 결단 뱃지
  const badgeEl = document.getElementById("final-action-badge");
  badgeEl.innerText = sc.finalAction;
  
  if (sc.actionBadge.includes("BUY")) {
    badgeEl.className = "px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center space-x-1";
  } else if (sc.actionBadge.includes("HOLD")) {
    badgeEl.className = "px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center space-x-1";
  } else {
    badgeEl.className = "px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center space-x-1";
  }

  document.getElementById("author-deep-comment").innerText = sc.authorComment;
  document.getElementById("book-moat-text").innerText = analysis.moat;

  // 핵심 모멘텀 (Bull Point) & 리스크 (Bear Point)
  const catalystsList = document.getElementById("book-catalysts-list");
  catalystsList.innerHTML = analysis.keyCatalysts.map(c => `
    <li class="flex items-start space-x-2 text-xs text-slate-300">
      <i class="fas fa-check-circle text-emerald-400 mt-0.5 text-xs"></i>
      <span>${c}</span>
    </li>
  `).join("");

  const risksList = document.getElementById("book-risks-list");
  risksList.innerHTML = analysis.keyRisks.map(r => `
    <li class="flex items-start space-x-2 text-xs text-slate-300">
      <i class="fas fa-exclamation-triangle text-amber-400 mt-0.5 text-xs"></i>
      <span>${r}</span>
    </li>
  `).join("");
}

/**
 * 기업 뉴스 피드 렌더링
 */
function renderNewsFeed(stock) {
  const container = document.getElementById("news-feed-container");
  if (!container) return;

  container.innerHTML = stock.news.map(n => {
    let sentBadge = `<span class="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">호재 (Bull)</span>`;
    if (n.sentiment === "negative") {
      sentBadge = `<span class="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] px-1.5 py-0.5 rounded font-bold">경계 (Bear)</span>`;
    } else if (n.sentiment === "neutral") {
      sentBadge = `<span class="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-1.5 py-0.5 rounded font-bold">중립 (Info)</span>`;
    }

    return `
      <div class="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-xl hover:border-slate-600 transition">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center space-x-2">
            ${sentBadge}
            <span class="text-[11px] text-slate-400">${n.date}</span>
          </div>
          <span class="text-[10px] text-slate-500">실시간 피드</span>
        </div>
        <h4 class="text-sm font-semibold text-slate-100 hover:text-sky-300 transition cursor-pointer">${n.title}</h4>
        <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">${n.summary}</p>
      </div>
    `;
  }).join("");
}

/**
 * 실시간 What-If 거시경제 시뮬레이터 (슬라이더 조작 시 차트 즉시 재계산)
 */
function initWhatIfSimulator() {
  const sliderRate = document.getElementById("sim-slider-rate");
  const sliderOil = document.getElementById("sim-slider-oil");
  const sliderGrowth = document.getElementById("sim-slider-growth");

  const valRate = document.getElementById("sim-val-rate");
  const valOil = document.getElementById("sim-val-oil");
  const valGrowth = document.getElementById("sim-val-growth");

  if (!sliderRate || !sliderOil || !sliderGrowth) return;

  const updateSim = () => {
    simParams.us10y = parseFloat(sliderRate.value);
    simParams.oil = parseFloat(sliderOil.value);
    simParams.growthBoost = parseFloat(sliderGrowth.value);

    valRate.innerText = `${simParams.us10y.toFixed(2)}%`;
    valOil.innerText = `$${simParams.oil.toFixed(0)}`;
    valGrowth.innerText = `${simParams.growthBoost >= 0 ? '+' : ''}${simParams.growthBoost}%`;

    // 현재 종목 차트 즉각 재렌더링
    const stock = STOCKS_DATABASE[currentTicker] || lookupOrGenerateStock(currentTicker);
    if (stock) {
      renderStockPredictionChart(stock);
    }
  };

  sliderRate.addEventListener("input", updateSim);
  sliderOil.addEventListener("input", updateSim);
  sliderGrowth.addEventListener("input", updateSim);

  // 리셋 버튼
  const resetBtn = document.getElementById("sim-reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      sliderRate.value = MARKET_MACRO_DATA.us10yYield.current;
      sliderOil.value = MARKET_MACRO_DATA.wtiOil.current;
      sliderGrowth.value = 0;
      updateSim();
    });
  }
}

/**
 * 저자의 '30:30:40' 포트폴리오 계산기 (책 11장, 12장 전략 반영)
 */
function initPortfolioCalculator() {
  const calcBtn = document.getElementById("btn-calc-portfolio");
  const inputFund = document.getElementById("input-total-fund");
  if (!calcBtn || !inputFund) return;

  calcBtn.addEventListener("click", () => {
    const totalAmount = parseFloat(inputFund.value) || 10000000;
    const nvdaAmount = totalAmount * 0.3;
    const tslaAmount = totalAmount * 0.3;
    const cashAmount = totalAmount * 0.4;

    const rate = MARKET_MACRO_DATA.exchangeRate.usdKrw;
    const nvdaPriceUsd = STOCKS_DATABASE["NVDA"].currentPrice;
    const tslaPriceUsd = STOCKS_DATABASE["TSLA"].currentPrice;

    const nvdaShares = Math.floor(nvdaAmount / (nvdaPriceUsd * rate));
    const tslaShares = Math.floor(tslaAmount / (tslaPriceUsd * rate));

    document.getElementById("port-nvda-fund").innerText = `${(nvdaAmount / 10000).toLocaleString()}만 원 (약 ${nvdaShares}주)`;
    document.getElementById("port-tsla-fund").innerText = `${(tslaAmount / 10000).toLocaleString()}만 원 (약 ${tslaShares}주)`;
    document.getElementById("port-cash-fund").innerText = `${(cashAmount / 10000).toLocaleString()}만 원`;

    // 공포탐욕지수 20 이하 분할매수 계획
    const step1 = (cashAmount * (1 / 3) / 10000).toFixed(0);
    const step2 = (cashAmount * (1 / 3) / 10000).toFixed(0);
    const step3 = (cashAmount * (1 / 3) / 10000).toFixed(0);

    document.getElementById("port-cash-plan").innerHTML = `
      <div class="text-xs text-slate-300 space-y-1 mt-2">
        <p>• <strong>1차 매수 (공포지수 ≤ 20 진입 시):</strong> ${Number(step1).toLocaleString()}만 원 투입</p>
        <p>• <strong>2차 매수 (추가 하락 및 저점 다질 시):</strong> ${Number(step2).toLocaleString()}만 원 투입</p>
        <p>• <strong>3차 매수 (바닥 확인 및 반등 시):</strong> ${Number(step3).toLocaleString()}만 원 투입</p>
      </div>
    `;
  });
}

/**
 * 부록 C: 매수 전 15개 철통 체크리스트 인터랙션
 */
function initChecklist() {
  const checkboxes = document.querySelectorAll(".check-item");
  const countEl = document.getElementById("checklist-passed-count");
  const resultEl = document.getElementById("checklist-evaluation");

  const evaluate = () => {
    let checkedCount = 0;
    checkboxes.forEach(cb => {
      if (cb.checked) checkedCount++;
    });

    if (countEl) countEl.innerText = `${checkedCount} / 15`;
    if (resultEl) {
      if (checkedCount === 15) {
        resultEl.innerHTML = `<span class="text-emerald-400 font-bold">15개 전부 합격: 완벽한 투자 가설 구축! 매수 집행 가능</span>`;
      } else if (checkedCount >= 12) {
        resultEl.innerHTML = `<span class="text-sky-300 font-semibold">12개 이상 합격: 우수한 펀더멘털. 미충족 리스크 보완 후 분할 매수</span>`;
      } else if (checkedCount >= 8) {
        resultEl.innerHTML = `<span class="text-amber-400 font-medium">주의 구간: 불확실성 상존. 현금을 쥐고 관망(Wait) 권장</span>`;
      } else {
        resultEl.innerHTML = `<span class="text-rose-400 font-bold">위험 구간: 손가락을 멈추고 팩트 재검증 필수 (매수 절대 금지)</span>`;
      }
    }
  };

  checkboxes.forEach(cb => {
    cb.addEventListener("change", evaluate);
  });
}
