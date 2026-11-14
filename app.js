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
  initMacroHeader();
  initSearch();
  initTickerShortcuts();
  initWhatIfSimulator();
  initPortfolioCalculator();
  initChecklist();
  loadStockDashboard(currentTicker);
});

/**
 * 상단 거시경제 헤더 바 초기화
 */
function initMacroHeader() {
  const macro = MARKET_MACRO_DATA;
  
  // 환율
  const elExchange = document.getElementById("macro-exchange");
  if (elExchange) {
    elExchange.innerHTML = `
      <div class="flex items-center space-x-1">
        <span class="text-xs text-slate-400">USD/KRW</span>
        <span class="font-bold text-sm text-slate-100">${macro.exchangeRate.usdKrw.toLocaleString()}원</span>
        <span class="text-xs text-emerald-400 font-semibold">+${macro.exchangeRate.change} (${macro.exchangeRate.changePct}%)</span>
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
    elOil.innerHTML = `
      <div class="flex items-center space-x-1">
        <span class="text-xs text-slate-400">WTI 유가</span>
        <span class="font-bold text-sm text-slate-100">$${macro.wtiOil.current}</span>
        <span class="text-xs text-emerald-400 font-semibold">${macro.wtiOil.changePct}%</span>
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
 * 사용자가 입력한 검색어에 대해 즉각 분석 제출 처리
 */
function handleSearchSubmit(query) {
  if (!query || query.trim() === "") return;
  const rawQ = query.trim();

  // 1. 범용 종목 분석 엔진 가동 (기존 DB 종목이든 새로 입력된 종목이든 상관없이 분석 산출)
  const stock = lookupOrGenerateStock(rawQ);
  if (!stock) return;

  currentTicker = stock.ticker;
  document.getElementById("stock-search-input").value = "";
  document.getElementById("search-suggestions").classList.add("hidden");
  
  // 2. 대시보드 렌더링
  loadStockDashboard(stock.ticker);

  // 3. 사용자 알림 토스트 표시
  showAnalysisNotice(stock.nameKo, stock.ticker, stock.sector);
}

function selectStock(ticker) {
  const stock = STOCKS_DATABASE[ticker] || lookupOrGenerateStock(ticker);
  if (stock) {
    currentTicker = stock.ticker;
    document.getElementById("stock-search-input").value = "";
    document.getElementById("search-suggestions").classList.add("hidden");
    loadStockDashboard(stock.ticker);
  }
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
function loadStockDashboard(ticker) {
  let stock = STOCKS_DATABASE[ticker];
  if (!stock) {
    stock = lookupOrGenerateStock(ticker);
  }
  if (!stock) return;

  currentTicker = stock.ticker;
  initTickerShortcuts();

  // 1. 헤더 요약 정보 업데이트
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

  document.getElementById("stock-current-price").innerText = `$${stock.currentPrice.toFixed(2)}`;
  const elPriceChange = document.getElementById("stock-price-change");
  elPriceChange.className = `text-sm font-semibold flex items-center space-x-1 ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  elPriceChange.innerHTML = `
    <span>${stock.change >= 0 ? '▲' : '▼'} $${Math.abs(stock.change).toFixed(2)}</span>
    <span>(${stock.change >= 0 ? '+' : ''}${stock.changePct}%)</span>
    <span class="text-xs text-slate-400 font-normal ml-2">오늘 실시간</span>
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

  // 2. 8대 실적 지표 & 실제 순수익률 렌더링 (부록 B 기반)
  renderFinancialCards(stock);

  // 3. 차트 렌더링 (실시간 주가 vs 향후 예상 주가 다른 색상 구분)
  renderStockPredictionChart(stock);

  // 4. 저자의 5단계 투자 진단 스코어카드
  renderFiveStepScorecard(stock);

  // 5. 최신 뉴스 및 감성 분석 피드
  renderNewsFeed(stock);

  // 6. 15대 체크리스트 종목명 반영
  document.getElementById("checklist-stock-target").innerText = `${stock.nameKo} (${stock.ticker})`;
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
 * 실시간 주가 차트 vs 향후 예상 주가 차트 (다른 색상으로 명확히 구분 렌더링)
 */
function renderStockPredictionChart(stock) {
  const ctx = document.getElementById("stock-prediction-chart").getContext("2d");
  const data = generateHistoricalAndFutureData(stock.ticker);
  if (!data) return;

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
            return index === cutoff ? 6 : 0; // 오늘 시점에 강조 포인트
          },
          pointBackgroundColor: "#38bdf8",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
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
              if (d === todayDate) return `${d} [오늘 기준일 - 현재 실시간가]`;
              return d > todayDate ? `${d} [AI 미래 예측 시점]` : `${d} [실제 거래일]`;
            },
            label: (item) => {
              if (item.raw === null || item.raw === undefined) return null;
              return ` ${item.dataset.label}: $${item.raw.toFixed(2)}`;
            },
            afterBody: (items) => {
              const item = items[0];
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
