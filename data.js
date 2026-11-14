/**
 * AI 시대, 미국 주식의 판이 바뀐다 (저자: 김완수)
 * 통합 실시간 마켓 데이터 및 종목 분석 엔진 데이터베이스
 */

const MARKET_MACRO_DATA = {
  updatedAt: "2026-11-14T15:00:00Z",
  exchangeRate: {
    usdKrw: 1395.40,
    change: +4.20,
    changePct: +0.30,
    status: "강달러 지속",
    analysis: "원/달러 환율 상승세로 미국 빅테크 주식 환차익 효과 발생. 단, 달러 강세 시 비미국권 매출 비중이 높은 빅테크의 외환 환산 손실 점검 필요."
  },
  fedRate: {
    current: "4.75% ~ 5.00%",
    status: "중립적 완화 국면",
    dotPlotTrend: "2026년 말 기준 4.25% 전망",
    analysis: "연준의 점진적 금리 인하 기조 속에서 인플레이션 둔화 속도를 주시 중. 급격한 인하는 경기 침체 신호일 수 있으므로 질서 있는 인하가 유리함."
  },
  us10yYield: {
    current: 4.42,
    change: +0.03,
    status: "경계 구간 (4.0% ~ 4.5%)",
    discountRateImpact: "고성장주 밸류에이션(PER) 압축 압력 상존",
    analysis: "미 10년물 국채 금리는 '무위험 할인율'의 핵심 기준. 4.5% 상회 시 고PER 성장주(엔비디아, 테슬라, 팔란티어 등)의 미래 이익 현재가치 하락으로 주가 변동성 확대 주의."
  },
  wtiOil: {
    current: 71.20,
    change: -0.65,
    changePct: -0.90,
    status: "안정 국면 ($70~$75)",
    inflationPressure: "낮음",
    analysis: "유가 안정으로 2차 인플레이션 재발 위험 제한적. 빅테크 데이터센터 전력 비용 및 물류비용 부담 완화 요인."
  },
  fearGreedIndex: {
    score: 41,
    rating: "Fear (공포)",
    prevClose: 38,
    weekAgo: 45,
    strategySignal: "분할 매수 레이더 가동 (20 이하 극단적 공포 시 40% 현금 실탄 1/3 즉각 투입 대기)",
    analysis: "지수가 41로 '공포' 영역에 위치. 대중의 심리가 위축된 상태이나 아직 책에서 제시한 20 이하의 '극단적 공포(Extreme Fear) 황금 매수 타점' 직전 관망 및 1차 준비 단계."
  },
  indices: {
    sp500: { current: 5930.50, changePct: +0.25 },
    nasdaq100: { current: 20920.10, changePct: +0.42 },
    qld: { current: 104.50, changePct: +0.85, note: "나스닥 2배 레버리지 (개별 종목 레버리지 지양, 시장 전체 지수 레버리지 원칙)" }
  }
};

const STOCKS_DATABASE = {
  "NVDA": {
    ticker: "NVDA",
    nameKo: "엔비디아",
    nameEn: "NVIDIA Corp.",
    sector: "AI 가속기 / 반도체 독점",
    chapter: "2장. 엔비디아 독주 시대, 1등 기업의 왕좌는 언제까지 유지될까?",
    authorPortfolioShare: "30% (정기 적립 투자 핵심 종목)",
    currentPrice: 148.50,
    change: +2.15,
    changePct: +1.47,
    marketCap: "3.65T",
    peRatio: 45.8,
    forwardPE: 33.2,
    psRatio: 28.5,
    week52High: 153.10,
    week52Low: 75.60,
    targetPriceBase: 185.00,
    targetPriceBull: 220.00,
    targetPriceBear: 120.00,
    
    financials: {
      period: "최근 공시 분기 (FY2026 Q3)",
      revenue: "$35.08B",
      revenueYoY: "+94.0%",
      datacenterRev: "$30.77B (비중 87.7%)",
      operatingIncome: "$21.87B",
      operatingMargin: "62.3%",
      netIncome: "$19.31B",
      netMargin: "55.0% (초고수익 독점 체제)",
      eps: "$0.81",
      epsConsensus: "$0.75",
      epsSurprise: "+8.0% (어닝 서프라이즈)",
      operatingCashFlow: "$17.63B",
      freeCashFlow: "$16.79B (FCF 마진 47.9%)",
      capEx: "$840M",
      guidance: "$37.5B ±2% (차기 분기 지속 상향)"
    },

    bookAnalysis: {
      moat: "CUDA 소프트웨어 플랫폼의 막강한 전환비용(Switching Cost)과 GPU 하드웨어 병렬연산의 압도적 우위. 전 세계 AI 개발자 생태계 락인.",
      keyCatalysts: [
        "차세대 아키텍처 블랙웰(Blackwell) 본격 양산 및 공급 물량 완판",
        "베라 루빈(Vera Rubin) 차차세대 플랫폼 로드맵으로 기술 격차 유지",
        "빅테크 클라우드 4사(MS, 구글, 아마존, 메타)의 CapEx 지속적 상향",
        "주주환원: 분기별 대규모 자사주 매입 및 배당 확대"
      ],
      keyRisks: [
        "빅테크 고객사들의 자체 AI ASIC 칩(구글 TPU, 아마존 Trainium, 메타 MTIA) 비중 확대",
        "데이터센터 전력 공급 병목(PJM 전력망 대란)으로 인한 서버 설치 속도 지연",
        "미 국채 10년물 금리 급등 시 고밸류에이션(PER 45배) 멀티플 압축 위험"
      ],
      fiveStepScore: {
        moatScore: 98,
        financialScore: 96,
        macroResilienceScore: 82,
        valuationScore: 78,
        finalAction: "강력 매수 (적립식 30% 유지 / 공포 지수 하락 시 적극 추가 매수)",
        actionBadge: "BUY",
        authorComment: "AI 인프라의 심장. 단순한 칩 판매사가 아닌 하드웨어+소프트웨어 풀스택 생태계 제왕."
      }
    },

    news: [
      {
        date: "2026-11-14",
        title: "엔비디아 블랙웰 울트라 공급 계약 쇄도... 빅테크 데이터센터 CapEx 상향 호조",
        sentiment: "positive",
        summary: "마이크로소프트와 아마존이 2026~2027년 회계연도 AI 설비투자를 추가 상향하며 엔비디아 차세대 칩 수요가 견고함을 입증."
      },
      {
        date: "2026-11-13",
        title: "월가 IB '엔비디아 실질 FCF 창출력은 테크 역사상 최고 수준' 목표주가 상향",
        sentiment: "positive",
        summary: "분기 160억 달러가 넘는 순수 잉여현금흐름(FCF)으로 주주환원과 차세대 R&D를 동시 달성 중인 독보적 재무 체력 평가."
      },
      {
        date: "2026-11-11",
        title: "미 10년물 국채 금리 4.4%대 재진입... 고밸류에이션 테크주 단기 숨고르기 장세",
        sentiment: "neutral",
        summary: "장기 국채 금리 반등으로 멀티플 압축 우려가 일시 대두되었으나, 견고한 실적 가이던스가 하방 지지선 역할."
      }
    ]
  },

  "TSLA": {
    ticker: "TSLA",
    nameKo: "테슬라",
    nameEn: "Tesla Inc.",
    sector: "전기차 · 자율주행(FSD) · 로보택시 · 로봇",
    chapter: "3장. 테슬라, 단순한 전기차를 넘어 AI·로봇 제국으로 도약할 수 있을까?",
    authorPortfolioShare: "30% (장기 모빌리티/AI 플랫폼 배팅)",
    currentPrice: 342.20,
    change: +5.80,
    changePct: +1.72,
    marketCap: "1.10T",
    peRatio: 79.2,
    forwardPE: 63.5,
    psRatio: 11.2,
    week52High: 360.50,
    week52Low: 138.80,
    targetPriceBase: 410.00,
    targetPriceBull: 540.00,
    targetPriceBear: 230.00,

    financials: {
      period: "최근 공시 분기 (2026 Q3)",
      revenue: "$25.18B",
      revenueYoY: "+7.8%",
      datacenterRev: "에너지 저장 부문 $2.38B (+52% YoY)",
      operatingIncome: "$2.72B",
      operatingMargin: "10.8% (마진율 반등)",
      netIncome: "$2.17B",
      netMargin: "8.62% (실제 순수익 회복세)",
      eps: "$0.72",
      epsConsensus: "$0.60",
      epsSurprise: "+20.0% (어닝 서프라이즈)",
      operatingCashFlow: "$6.25B",
      freeCashFlow: "$2.74B",
      capEx: "$3.51B (AI 컴퓨팅 및 사이버캡 인프라)",
      guidance: "2026년 전체 차량 인도량 전년 대비 플러스 전환 및 FSD v13 상용화 가속"
    },

    bookAnalysis: {
      moat: "수백만 대 실주행 비전 데이터 독점, 엔드투엔드(End-to-End) 신경망 FSD, 메가팩 ESS 에너지 생태계, 독자 수직계열화 제조 공정.",
      keyCatalysts: [
        "FSD V13 자율주행 규제 승인 및 유료 구독 전환율 급증",
        "사이버캡(Cybercab) 기반 무인 로보택시 거점 도시 상용 서비스 개시",
        "메가팩(Megapack) 에너지 저장 사업 분기 13GWh 이상 폭발적 배치",
        "옵티머스(Optimus) 3세대 기가팩토리 실전 조립 라인 투입 및 원가 절감"
      ],
      keyRisks: [
        "글로벌 전기차 가격 치킨게임으로 인한 차량 부문 매출총이익률(Gross Margin) 압박",
        "자율주행 각국 정부 규제 승인 지연 및 안전성 검증 이슈",
        "신사업(로보택시/로봇) 대규모 CapEx 지출 지속에 따른 FCF 변동성"
      ],
      fiveStepScore: {
        moatScore: 94,
        financialScore: 84,
        macroResilienceScore: 79,
        valuationScore: 72,
        finalAction: "적립식 매수 유지 (30% 비중 / 거시경제 금리 급등 시 분할 매수)",
        actionBadge: "BUY",
        authorComment: "현재의 전기차 본업과 에너지 캐시카우를 딛고, FSD와 로보택시가 만개하는 시점에 시가총액이 재정의될 기업."
      }
    },

    news: [
      {
        date: "2026-11-14",
        title: "테슬라 FSD 13.2 무개입 주행거리 5배 향상... 운전자 유료 구독 전환율 28% 돌파",
        sentiment: "positive",
        summary: "비전 기반 AI 모델 고도화로 도시 주행 개입률이 극적으로 감소하며 고마진 소프트웨어 매출 본격화."
      },
      {
        date: "2026-11-12",
        title: "메가팩 배치량 분기 14GWh 역대 최대... 데이터센터 전력 보조 필수재로 등극",
        sentiment: "positive",
        summary: "글로벌 빅테크 데이터센터들의 전력 백업 수요 급증으로 테슬라 에너지 사업부 영업이익률 20% 돌파."
      },
      {
        date: "2026-11-10",
        title: "美 도로교통안전국(NHTSA) 자율주행 규제 프레임워크 개편 예고",
        sentiment: "neutral",
        summary: "로보택시 무인 운행 허가 기준이 표준화될 것으로 기대되나 엄격한 안전성 실증 데이터 제출 요구."
      }
    ]
  },

  "PLTR": {
    ticker: "PLTR",
    nameKo: "팔란티어",
    nameEn: "Palantir Technologies",
    sector: "엔터프라이즈 AI 플랫폼(AIP) 독점",
    chapter: "5장. 팔란티어, AI 소프트웨어는 어떻게 진짜 돈을 쓸어담는가?",
    authorPortfolioShare: "포트폴리오 위성 종목 (2~3개월 주기 묵직한 분할 매수)",
    currentPrice: 65.40,
    change: +3.20,
    changePct: +5.14,
    marketCap: "148.2B",
    peRatio: 102.5,
    forwardPE: 68.4,
    psRatio: 48.2,
    week52High: 68.90,
    week52Low: 19.80,
    targetPriceBase: 82.00,
    targetPriceBull: 110.00,
    targetPriceBear: 44.00,

    financials: {
      period: "최근 공시 분기 (2026 Q3)",
      revenue: "$725.5M",
      revenueYoY: "+30.0% (미국 민간 부문 +54%)",
      datacenterRev: "AIP 부트캠프 계약 건수 폭증",
      operatingIncome: "$113.1M (GAAP 기준 흑자 정착)",
      operatingMargin: "15.6% (조정 영업이익률 38%)",
      netIncome: "$143.5M",
      netMargin: "19.8% (알짜 소프트웨어 순수익)",
      eps: "$0.10",
      epsConsensus: "$0.08",
      epsSurprise: "+25.0%",
      operatingCashFlow: "$420.2M",
      freeCashFlow: "$380.5M (조정 FCF 마진 52%)",
      capEx: "$12.4M (극도의 자본경량 소프트웨어 모델)",
      guidance: "2026년 연간 매출 및 GAAP 영업이익 가이던스 대폭 상향 조정"
    },

    bookAnalysis: {
      moat: "피터 틸의 '경쟁은 패자를 위한 것' 독점 철학. 복잡한 엔터프라이즈 데이터를 하나로 엮는 온톨로지(Ontology) 아키텍처로 대체 불가.",
      keyCatalysts: [
        "AIP(Artificial Intelligence Platform) 부트캠프 후 정식 유료 전환율 폭증",
        "미국 민간 상업용(US Commercial) 고객 수 및 총계약금액(TCV) 50% 이상 성장",
        "S&P 500 편입 이후 기관 패시브 자금 지속 유입 및 GAAP 순이익 퀀텀점프",
        "서방 정부 및 국방 안보 분야의 철통같은 독점적 캐시카우"
      ],
      keyRisks: [
        "PER 100배를 넘나드는 초고밸류에이션으로 실적 미스 발생 시 주가 낙폭 위험",
        "정부 부문 수주 예산 집행 주기에 따른 분기별 매출 변동성",
        "임직원 주식보상비용(SBC)에 따른 주식 수 희석 여부 지속 모니터링"
      ],
      fiveStepScore: {
        moatScore: 96,
        financialScore: 92,
        macroResilienceScore: 85,
        valuationScore: 64,
        finalAction: "분할 매수 (단기 급등 시 추격 금지, 2~3개월 호흡 딥 눌림목 매수)",
        actionBadge: "HOLD_OR_BUY_DIP",
        authorComment: "하드웨어 인프라 다음을 지배할 진정한 소프트웨어 황제. 비즈니스 체질이 현금 제조기로 완벽 진화."
      }
    },

    news: [
      {
        date: "2026-11-14",
        title: "팔란티어 AIP 도입 기업 1,000개 사 돌파... 포춘 500대 기업 장악 속도전",
        sentiment: "positive",
        summary: "사내 ERP 및 공급망 데이터에 AIP를 탑재한 글로벌 제조업체들의 운영비 절감 효과가 입증되며 재계약 단가 인상."
      },
      {
        date: "2026-11-12",
        title: "미 국방부 합동 전 영역 지휘통제(JADC2) 추가 다년 계약 체결 공시",
        sentiment: "positive",
        summary: "안보 최전선에서의 대체 불가능한 독점적 보안 소프트웨어로서의 입지 재확인."
      },
      {
        date: "2026-11-09",
        title: "고PER 성장주 밸류에이션 논란... 월가 '단기 과열' vs '소프트웨어 슈퍼사이클' 팽팽",
        sentiment: "neutral",
        summary: "실적 성장세는 눈부시나 주가가 가파르게 상승하여 분할 매수 호흡을 유지해야 한다는 분석."
      }
    ]
  },

  "META": {
    ticker: "META",
    nameKo: "메타",
    nameEn: "Meta Platforms",
    sector: "소셜 플랫폼 · 디지털 광고 · 오픈소스 AI(Llama)",
    chapter: "7장. 애플과 메타, AI를 만난 기존 거인들의 화려한 반격",
    authorPortfolioShare: "적극 매수 (애플 매도 후 비중 교체 종목)",
    currentPrice: 592.80,
    change: +7.40,
    changePct: +1.26,
    marketCap: "1.50T",
    peRatio: 27.2,
    forwardPE: 22.8,
    psRatio: 9.8,
    week52High: 615.00,
    week52Low: 310.00,
    targetPriceBase: 710.00,
    targetPriceBull: 840.00,
    targetPriceBear: 510.00,

    financials: {
      period: "최근 공시 분기 (2026 Q3)",
      revenue: "$40.59B",
      revenueYoY: "+19.0%",
      datacenterRev: "핵심 광고 매출 $39.88B (+18.7%)",
      operatingIncome: "$17.35B",
      operatingMargin: "42.7% (경이로운 마진 유지)",
      netIncome: "$15.69B",
      netMargin: "38.6% (광고 현금 머신)",
      eps: "$6.03",
      epsConsensus: "$5.25",
      epsSurprise: "+14.8%",
      operatingCashFlow: "$24.72B",
      freeCashFlow: "$15.52B",
      capEx: "$9.20B (AI 인프라 및 자체 Llama 클러스터)",
      guidance: "차기 분기 매출 $45B~$48B 및 광고 단가 견조 유지"
    },

    bookAnalysis: {
      moat: "36억 일일활성이용자(DAP)의 인스타그램/페이스북/왓츠앱 네트워크 효과. 광고 타깃팅 AI(Advantage+)로 광고주 ROI 극대화 및 광고 단가/노출 동반 상승.",
      keyCatalysts: [
        "AI 추천 알고리즘으로 유저 체류 시간 증가 및 광고 뷰 단가(+12%) 상승",
        "오픈소스 라마(Llama) 생태계 표준 장악 및 차세대 AI 에이전트 서비스 상용화",
        "비용 효율화와 탄탄한 광고 수익으로 대규모 AI CapEx를 자체 현금으로 전액 충당",
        "자사주 매입과 배당 개시로 주주가치 제고 극대화"
      ],
      keyRisks: [
        "2026~2027년 연간 CapEx 규모 급증에 따른 감가상각비 부담 및 단기 영업이익률 압박",
        "유럽 등 글로벌 규제 당국의 디지털 시장법(DMA) 및 개인정보 규제 리스크"
      ],
      fiveStepScore: {
        moatScore: 95,
        financialScore: 97,
        macroResilienceScore: 90,
        valuationScore: 92,
        finalAction: "강력 매수 (빅테크 중 가장 매력적인 합리적 PER 27배 & 막강한 FCF 체력)",
        actionBadge: "STRONG_BUY",
        authorComment: "저자가 애플을 전량 매도하고 메타를 선택한 이유: 뜬구름 잡는 비전이 아닌 현재의 본업 광고에 AI를 이식해 거대한 순이익으로 즉각 환전하는 진정한 승자."
      }
    },

    news: [
      {
        date: "2026-11-14",
        title: "메타 AI 에이전트 광고 솔루션, 소상공인 마케팅 전환율 35% 증대",
        sentiment: "positive",
        summary: "생성형 AI 광고 소재 제작 툴과 실시간 정밀 타깃팅 결합으로 광고주 이탈 방어 및 단가 동반 상승."
      },
      {
        date: "2026-11-12",
        title: "Llama 4 모델 글로벌 오픈소스 커뮤니티 주도권 확보... 개발자 락인 가속",
        sentiment: "positive",
        summary: "자체 AI 반도체 MTIA v2 탑재 데이터센터 가동으로 엔비디아 의존도 분산 및 추론 원가 절감 달성."
      },
      {
        date: "2026-11-08",
        title: "메타 2026년 CapEx 가이던스 상향 발표... '현금흐름 체력 충분' 시장 안도",
        sentiment: "neutral",
        summary: "영업활동 현금흐름 240억 달러가 설비투자를 넉넉히 커버하며 FCF 흑자 기조 유지."
      }
    ]
  },

  "MSFT": {
    ticker: "MSFT",
    nameKo: "마이크로소프트",
    nameEn: "Microsoft Corp.",
    sector: "기업용 소프트웨어 · 애저(Azure) 클라우드",
    chapter: "6장. 마이크로소프트·아마존·알파벳: 빅테크 클라우드 전쟁의 최종 승자는?",
    authorPortfolioShare: "6개월 주기 저점 매수 전략 대상",
    currentPrice: 428.10,
    change: +1.80,
    changePct: +0.42,
    marketCap: "3.18T",
    peRatio: 34.2,
    forwardPE: 28.5,
    psRatio: 12.8,
    week52High: 468.35,
    week52Low: 388.00,
    targetPriceBase: 495.00,
    targetPriceBull: 560.00,
    targetPriceBear: 370.00,

    financials: {
      period: "최근 공시 분기 (FY2026 Q1)",
      revenue: "$65.58B",
      revenueYoY: "+16.0%",
      datacenterRev: "애저(Azure) 클라우드 성장률 +33% YoY",
      operatingIncome: "$30.55B",
      operatingMargin: "46.6%",
      netIncome: "$24.67B",
      netMargin: "37.6%",
      eps: "$3.30",
      epsConsensus: "$3.10",
      epsSurprise: "+6.5%",
      operatingCashFlow: "$34.18B",
      freeCashFlow: "$19.30B",
      capEx: "$14.88B (AI 데이터센터 대규모 확장)",
      guidance: "차기 분기 클라우드 지속 30%대 성장 전망"
    },

    bookAnalysis: {
      moat: "전 세계 오피스 인프라(Windows, Office 365, Teams) 독점. 기업들이 기존 업무 도구 안에서 코파일럿(Copilot)을 자연스럽게 유료 결제하는 구조.",
      keyCatalysts: [
        "M365 Copilot 유료 구독 좌석(Seat) 전환율 가속",
        "애저(Azure)의 오픈AI 모델 호스팅 및 엔터프라이즈 AI 워크로드 독점",
        "원자력 발전소(쓰리마일섬 원전 재가동 등) 장기 전력 PPA 체결로 전력 병목 선제 해결"
      ],
      keyRisks: [
        "AI 데이터센터 막대한 설비투자 대비 유료 구독 매출 전환 시차(ROI 검증)",
        "미 국채 10년물 금리 상승 시 밸류에이션 멀티플 압박"
      ],
      fiveStepScore: {
        moatScore: 96,
        financialScore: 95,
        macroResilienceScore: 88,
        valuationScore: 82,
        finalAction: "분할 매수 (시장 발작 및 6개월 주기 저점 도달 시 40% 현금 투입)",
        actionBadge: "BUY_ON_DIP",
        authorComment: "직장인들의 업무 일상에 AI 핏줄을 꽂은 기업. 6개월 주기 가격 조정 국면마다 묵직하게 담아갈 자산."
      }
    },

    news: [
      {
        date: "2026-11-13",
        title: "마이크로소프트, 차세대 AI 데이터센터용 소형모듈원자로(SMR) 전력 계약 체결",
        sentiment: "positive",
        summary: "데이터센터 전력 병목을 극복하기 위해 무탄소 기저부하 전력 20년 장기 수급 계약 확보."
      },
      {
        date: "2026-11-10",
        title: "애저 AI 사용량 전년비 120% 폭증... 기업 클라우드 점유율 격차 축소",
        sentiment: "positive",
        summary: "글로벌 금융 및 헬스케어 기업들의 온프레미스 시스템의 애저 AI 마이그레이션 본격화."
      }
    ]
  },

  "AMZN": {
    ticker: "AMZN",
    nameKo: "아마존",
    nameEn: "Amazon.com Inc.",
    sector: "AWS 클라우드 · 이커머스 · AI 인프라",
    chapter: "6장. 마이크로소프트·아마존·알파벳: 빅테크 클라우드 전쟁의 최종 승자는?",
    authorPortfolioShare: "6개월 주기 저점 매수 전략 대상",
    currentPrice: 209.50,
    change: +2.80,
    changePct: +1.35,
    marketCap: "2.18T",
    peRatio: 41.5,
    forwardPE: 32.1,
    psRatio: 3.5,
    week52High: 215.90,
    week52Low: 144.00,
    targetPriceBase: 255.00,
    targetPriceBull: 310.00,
    targetPriceBear: 175.00,

    financials: {
      period: "최근 공시 분기 (2026 Q3)",
      revenue: "$158.88B",
      revenueYoY: "+11.0%",
      datacenterRev: "AWS 매출 $27.45B (+19% YoY, 연환산 $110B 돌파)",
      operatingIncome: "$17.41B",
      operatingMargin: "11.0%",
      netIncome: "$15.33B",
      netMargin: "9.65%",
      eps: "$1.43",
      epsConsensus: "$1.14",
      epsSurprise: "+25.4%",
      operatingCashFlow: "$29.80B",
      freeCashFlow: "$18.50B",
      capEx: "$16.30B (AWS 데이터센터 확충)",
      guidance: "홀리데이 시즌 역대급 매출 및 AWS 영업이익률 38% 돌파 전망"
    },

    bookAnalysis: {
      moat: "세계 1위 클라우드 인프라 AWS, Bedrock 멀티 AI 모델 중립 플랫폼, 물류/배송 로봇 AI 효율화.",
      keyCatalysts: [
        "AWS Bedrock을 통한 엔트로픽, 메타, 미스트랄 등 멀티 모델 선택권 제공으로 엔터프라이즈 선호",
        "자체 AI 가속기 Trainium/Inferentia 보급 확대로 고객 클라우드 비용 절감 및 마진 방어",
        "물류 창고 로봇 자동화로 이커머스 고정비 비약적 절감"
      ],
      keyRisks: [
        "소비 둔화 시 이커머스 부문 고정비 부담",
        "클라우드 3사(AWS, Azure, GCP) 간의 가격 경쟁"
      ],
      fiveStepScore: {
        moatScore: 94,
        financialScore: 93,
        macroResilienceScore: 84,
        valuationScore: 80,
        finalAction: "분할 매수 (6개월 주기 저점 공략)",
        actionBadge: "BUY_ON_DIP",
        authorComment: "단순한 쇼핑몰이 아닌 거대한 디지털 인프라의 주인. AI 모델 다양성 전략이 B2B 고객을 락인."
      }
    },

    news: [
      {
        date: "2026-11-14",
        title: "AWS 베드록, 고객 맞춤형 생성 AI 파이프라인 수주 급증",
        sentiment: "positive",
        summary: "특정 모델 종속을 피하려는 글로벌 금융사들이 AWS를 멀티 AI 통합 허브로 채택."
      },
      {
        date: "2026-11-11",
        title: "아마존 물류 풀필먼트에 차세대 휴머노이드 로봇 1만 대 추가 배치",
        sentiment: "positive",
        summary: "배송 처리 시간 20% 단축 및 연간 수십억 달러 단위 인건비 절감 효과 가시화."
      }
    ]
  },

  "GOOGL": {
    ticker: "GOOGL",
    nameKo: "알파벳(구글)",
    nameEn: "Alphabet Inc.",
    sector: "구글 검색 · 유튜브 · 구글 클라우드 · 제미나이(Gemini)",
    chapter: "6장. 마이크로소프트·아마존·알파벳: 빅테크 클라우드 전쟁의 최종 승자는?",
    authorPortfolioShare: "6개월 주기 저점 매수 전략 대상",
    currentPrice: 180.20,
    change: +2.10,
    changePct: +1.18,
    marketCap: "2.22T",
    peRatio: 23.4,
    forwardPE: 19.8,
    psRatio: 6.5,
    week52High: 191.75,
    week52Low: 130.00,
    targetPriceBase: 225.00,
    targetPriceBull: 270.00,
    targetPriceBear: 155.00,

    financials: {
      period: "최근 공시 분기 (2026 Q3)",
      revenue: "$88.27B",
      revenueYoY: "+15.0%",
      datacenterRev: "구글 클라우드 $11.35B (+35% YoY)",
      operatingIncome: "$28.52B",
      operatingMargin: "32.3%",
      netIncome: "$26.30B",
      netMargin: "29.8%",
      eps: "$2.12",
      epsConsensus: "$1.85",
      epsSurprise: "+14.6%",
      operatingCashFlow: "$30.70B",
      freeCashFlow: "$17.60B",
      capEx: "$13.10B",
      guidance: "제미나이 2.5 탑재 검색 엔진 광고 효율 증대 및 클라우드 마진율 지속 개선"
    },

    bookAnalysis: {
      moat: "자체 AI 모델(제미나이) + 자체 AI 칩(TPU v6) + 독자 클라우드 + 수십억 유저 서비스(검색/유튜브/안드로이드)의 완벽한 AI 수직계열화.",
      keyCatalysts: [
        "구글 클라우드(GCP) 연간 35% 이상 폭발적 흑자 성장",
        "자체 TPU 가속기로 엔비디아 GPU 대비 AI 추론 비용 혁신적 절감",
        "빅테크 중 가장 저평가된 매력적인 밸류에이션(PER 23배)"
      ],
      keyRisks: [
        "AI 오버뷰(AI Overviews) 검색 도입에 따른 기존 검색 광고 클릭률 단기 잠식 우려",
        "미 법무부(DOJ) 반독점 소송에 따른 크롬/안드로이드 사업부 분할 노이즈"
      ],
      fiveStepScore: {
        moatScore: 93,
        financialScore: 96,
        macroResilienceScore: 89,
        valuationScore: 94,
        finalAction: "강력 매수 (PER 23배의 최저평가 빅테크, AI 수직계열화 최강자)",
        actionBadge: "STRONG_BUY",
        authorComment: "검색 침해 우려는 과도하며 클라우드 폭풍 성장과 자체 TPU의 원가 경쟁력이 빛을 발하는 구간."
      }
    },

    news: [
      {
        date: "2026-11-14",
        title: "구글 6세대 TPU '트릴리움(Trillium)' 대량 양산... AI 클라우드 원가 40% 절감",
        sentiment: "positive",
        summary: "자체 반도체 수직계열화로 엔비디아 의존도를 낮추고 외부 엔터프라이즈 AI 호스팅 마진율 급상승."
      },
      {
        date: "2026-11-12",
        title: "유튜브 쇼츠 AI 추천 최적화로 시청 시간 25% 증가, 광고 매출 견인",
        sentiment: "positive",
        summary: "제미나이 비전 기반 콘텐츠 태깅으로 광고 타깃팅 정밀도 향상."
      }
    ]
  },

  "AAPL": {
    ticker: "AAPL",
    nameKo: "애플",
    nameEn: "Apple Inc.",
    sector: "하드웨어 생태계 · 애플 인텔리전스 · 프리미엄 서비스",
    chapter: "7장. 애플과 메타, AI를 만난 기존 거인들의 화려한 반격",
    authorPortfolioShare: "전량 매도 (저자의 투자 철학 불일치: 혁신 정체 및 보수적 행보)",
    currentPrice: 228.40,
    change: -1.20,
    changePct: -0.52,
    marketCap: "3.45T",
    peRatio: 34.8,
    forwardPE: 30.2,
    psRatio: 8.9,
    week52High: 237.20,
    week52Low: 164.00,
    targetPriceBase: 245.00,
    targetPriceBull: 280.00,
    targetPriceBear: 195.00,

    financials: {
      period: "최근 공시 분기 (FY2026 Q4)",
      revenue: "$94.93B",
      revenueYoY: "+6.1%",
      datacenterRev: "서비스 부문 $24.97B (+12% YoY, 역대 최대)",
      operatingIncome: "$29.59B",
      operatingMargin: "31.2%",
      netIncome: "$14.74B",
      netMargin: "15.5%",
      eps: "$0.97",
      epsConsensus: "$0.95",
      epsSurprise: "+2.1%",
      operatingCashFlow: "$26.80B",
      freeCashFlow: "$23.90B",
      capEx: "$2.90B (초저자본 온디바이스 모델)",
      guidance: "아이폰 신제품 슈퍼사이클 지속 및 서비스 매출 두 자릿수 성장 유지"
    },

    bookAnalysis: {
      moat: "20억 대 활성 기기 기반 폐쇄형 생태계(Walled Garden)와 막강한 브랜드 로열티, 고마진 서비스 구독.",
      keyCatalysts: [
        "애플 인텔리전스(Apple Intelligence) 고도화로 구형 아이폰 교체 슈퍼사이클 촉발",
        "앱스토어, 아이클라우드 등 서비스 부문의 마르지 않는 고마진 현금 창출",
        "안전자산 선호 심리: AI 거품론 시 빅테크 중 가장 안전한 방어마루 역할"
      ],
      keyRisks: [
        "애플카 프로젝트 전격 중단 등 미래 파괴적 신사업 도전의 보수적 태도",
        "생성형 AI 기술 자체는 오픈AI 등 외부에 의존하는 한계",
        "성장률(6%) 대비 높은 PER 35배의 밸류에이션 부담"
      ],
      fiveStepScore: {
        moatScore: 97,
        financialScore: 94,
        macroResilienceScore: 92,
        valuationScore: 70,
        finalAction: "관망 또는 비중 축소 (저자는 혁신 지향 관점에서 전량 매도 완료)",
        actionBadge: "HOLD_OR_SELL",
        authorComment: "지구상 가장 단단한 성벽이지만, 새로운 시대를 주도하는 폭발적 성장성을 원한다면 메타/엔비디아가 더 매력적."
      }
    },

    news: [
      {
        date: "2026-11-13",
        title: "애플 인텔리전스 글로벌 언어 지원 확대... 유럽/아시아 교체 수요 견조",
        sentiment: "positive",
        summary: "온디바이스 프라이버시 보호 기능이 호평받으며 신형 아이폰 프로 모델 비중 증가."
      },
      {
        date: "2026-11-10",
        title: "월가 일각 '애플, 자체 AI 파운데이션 모델 개발 속도 경쟁사 대비 지연' 지적",
        sentiment: "negative",
        summary: "오픈AI 및 서드파티 제휴 의존 구조가 장기 플랫폼 수수료 협상력에 미칠 영향 우려."
      }
    ]
  },

  "SPCX": {
    ticker: "SPCX",
    nameKo: "스페이스X (가상 상장/우주 인프라)",
    nameEn: "Space Exploration Technologies",
    sector: "우주 운송 · 스타링크 · 우주 AI 데이터센터",
    chapter: "9장. 우주 데이터센터와 꿈의 미래 기술, 어디까지 믿고 투자해야 할까?",
    authorPortfolioShare: "10년 뒤를 바라보는 정기 적립식 분할 투자",
    currentPrice: 148.20,
    change: +3.50,
    changePct: +2.42,
    marketCap: "320B",
    peRatio: 145.0,
    forwardPE: 85.0,
    psRatio: 22.0,
    week52High: 225.64,
    week52Low: 104.83,
    targetPriceBase: 195.00,
    targetPriceBull: 280.00,
    targetPriceBear: 95.00,

    financials: {
      period: "책 기준 2026 Q2 공시",
      revenue: "$7.81B",
      revenueYoY: "+91.9%",
      datacenterRev: "스타링크 가입자 1,200만 명 돌파 (매출 +66%)",
      operatingIncome: "$1.85B",
      operatingMargin: "23.7%",
      netIncome: "-$541M (스타십/AI 인프라 투자로 분기 순손실)",
      netMargin: "-6.9% (외형 성장 vs 순이익 구분 필요)",
      eps: "-$0.25",
      epsConsensus: "-$0.40",
      epsSurprise: "적자 대폭 축소",
      operatingCashFlow: "$2.10B",
      freeCashFlow: "-$1.40B",
      capEx: "$3.50B (스타십 V3 및 우주 광통신망 확충)",
      guidance: "수주잔고 $47.5B 및 2027년 FCF 흑자 전환 목표"
    },

    bookAnalysis: {
      moat: "재사용 로켓 독점 기술로 전 세계 우주 발사 시장 80% 장악, 스타링크 메가 콘스텔레이션 저궤도 위성 통신망 백본.",
      keyCatalysts: [
        "스타십 V3 완전 재사용으로 kg당 발사 단가 1/10 수준 파괴",
        "지상 전력망 한계를 돌파할 우주 엣지 컴퓨팅(Space Edge Computing) 상용화",
        "스타링크 유료 구독자 1,200만 명 기반 고마진 현금 흐름 창출"
      ],
      keyRisks: [
        "초대형 우주 인프라 구축에 따른 조 단위 CapEx 지속 지출",
        "우주 방사선 및 복사 방열 기술 난제 해결 시차"
      ],
      fiveStepScore: {
        moatScore: 99,
        financialScore: 78,
        macroResilienceScore: 75,
        valuationScore: 60,
        finalAction: "장기 소액 적립식 매수 (단기 밸류에이션 변동성 극심, 10년 비전 분할)",
        actionBadge: "BUY_LONG_TERM",
        authorComment: "책 9장 특별 분석 종목. 지상 데이터센터의 전력 병목을 우주에서 해결할 독보적 1위 인프라 기업."
      }
    },

    news: [
      {
        date: "2026-11-14",
        title: "스타십 7차 시험비행 완벽 성공... 저궤도 AI 컴퓨팅 위성 프로토타입 궤도 안착",
        sentiment: "positive",
        summary: "우주 방열 라디에이터 및 레이저 광통신 실증 시험 성공으로 우주 데이터센터 상용화 1단계 진입."
      },
      {
        date: "2026-11-11",
        title: "글로벌 클라우드사들과 100억 달러 규모 우주 통신 백본 공급 계약 논의",
        sentiment: "positive",
        summary: "지상망 연결이 어려운 오지 및 국방 자산 연동을 위한 스타링크 엔터프라이즈 수요 폭증."
      }
    ]
  }
};

/**
 * 6개월 과거 주가 생성기 + 향후 1년 예상 주가 시나리오 생성 함수
 */
function generateHistoricalAndFutureData(ticker) {
  const stock = STOCKS_DATABASE[ticker];
  if (!stock) return null;

  const currentPrice = stock.currentPrice;
  const dates = [];
  const actualPrices = [];
  const actualVolumes = [];
  
  // 지난 120영업일 (약 6개월) 시뮬레이션
  const baseDate = new Date("2026-11-14");
  const historyDays = 120;
  
  // 주가 변동성 기반으로 과거 가격 복원 (책의 흐름 및 실제 트렌드 반영)
  let p = currentPrice * 0.75; // 6개월 전 대략 75% 수준에서 출발
  if (ticker === 'AAPL') p = currentPrice * 0.95;
  if (ticker === 'PLTR') p = currentPrice * 0.45;
  if (ticker === 'TSLA') p = currentPrice * 0.65;

  for (let i = historyDays; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i * 1.4);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(dateStr);

    // 마지막 날(오늘)은 현재 가격
    if (i === 0) {
      actualPrices.push(currentPrice);
      actualVolumes.push(Math.round(45 + Math.random() * 20));
    } else {
      // 점진적 상승 + 노이즈
      const drift = (currentPrice - p) / i;
      const noise = (Math.random() - 0.48) * (currentPrice * 0.035);
      p = Math.max(p + drift + noise, currentPrice * 0.3);
      actualPrices.push(parseFloat(p.toFixed(2)));
      actualVolumes.push(Math.round(30 + Math.random() * 35));
    }
  }

  // 미래 예상치 (향후 90일 / 120영업일 예상 궤적)
  // 오늘까지는 null로 채우고, 오늘부터 미래로 연결
  const futureDates = [];
  const predictedBase = new Array(dates.length - 1).fill(null);
  const predictedBull = new Array(dates.length - 1).fill(null);
  const predictedBear = new Array(dates.length - 1).fill(null);

  // 오늘 시점 값 추가 (차트 연속성을 위해)
  predictedBase.push(currentPrice);
  predictedBull.push(currentPrice);
  predictedBear.push(currentPrice);

  const targetBase = stock.targetPriceBase;
  const targetBull = stock.targetPriceBull;
  const targetBear = stock.targetPriceBear;

  const futureSteps = 60; // 향후 60 구간 (약 6개월~1년)
  for (let j = 1; j <= futureSteps; j++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + j * 3);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(dateStr);
    actualPrices.push(null); // 미래 구간은 실제 주가 없음
    actualVolumes.push(null);

    const progress = j / futureSteps;
    // 부드러운 곡선 적용 (Ease out)
    const curve = Math.sin(progress * (Math.PI / 2));
    
    // 기본 예측 (Base)
    const baseVal = currentPrice + (targetBase - currentPrice) * curve + (Math.sin(j * 0.5) * currentPrice * 0.015);
    // 낙관 예측 (Bull)
    const bullVal = currentPrice + (targetBull - currentPrice) * curve + (Math.sin(j * 0.4) * currentPrice * 0.02);
    // 보수 예측 (Bear)
    const bearVal = currentPrice + (targetBear - currentPrice) * curve + (Math.cos(j * 0.5) * currentPrice * 0.015);

    predictedBase.push(parseFloat(baseVal.toFixed(2)));
    predictedBull.push(parseFloat(bullVal.toFixed(2)));
    predictedBear.push(parseFloat(bearVal.toFixed(2)));
  }

  return {
    dates,
    actualPrices,
    actualVolumes,
    predictedBase,
    predictedBull,
    predictedBear,
    cutoffIndex: historyDays
  };
}

// 브라우저 전역 객체로 내보내기
if (typeof window !== 'undefined') {
  window.MARKET_MACRO_DATA = MARKET_MACRO_DATA;
  window.STOCKS_DATABASE = STOCKS_DATABASE;
  window.generateHistoricalAndFutureData = generateHistoricalAndFutureData;
}
