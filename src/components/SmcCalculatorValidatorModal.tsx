import React, { useState, useMemo, useEffect } from 'react';
import {
  ASSET_SPECIFICATIONS,
  AssetSpecification,
  TradeDirection,
  SmcCalculationInput,
  calculateSmcPosition,
  SmcValidatorCriteria,
  evaluateSmcSetup,
} from '../utils/smcCalculatorEngine';

interface SmcCalculatorValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsultMentor?: (promptText: string) => void;
}

interface SavedSmcSetup {
  id: string;
  timestamp: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  lots: number;
  riskDollar: number;
  riskReward: number;
  score: number;
  grade: string;
}

const JOURNAL_STORAGE_KEY = 'al_hadiqa_smc_journal';

export const SmcCalculatorValidatorModal: React.FC<SmcCalculatorValidatorModalProps> = ({
  isOpen,
  onClose,
  onConsultMentor,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'validator' | 'journal'>('calculator');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // --- ESTADO DE LA CALCULADORA MATEMÁTICA ---
  const [symbol, setSymbol] = useState<string>('EURUSD');
  const [direction, setDirection] = useState<TradeDirection>('BUY');
  const [accountBalance, setAccountBalance] = useState<number>(5000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);

  // Precios predeterminados según el activo seleccionado
  const selectedAsset = useMemo<AssetSpecification>(() => {
    return ASSET_SPECIFICATIONS[symbol] || ASSET_SPECIFICATIONS.EURUSD;
  }, [symbol]);

  const [entryPrice, setEntryPrice] = useState<number>(1.08350);
  const [stopLossPrice, setStopLossPrice] = useState<number>(1.08150);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(1.09050);
  const [rangeHigh, setRangeHigh] = useState<number>(1.09200);
  const [rangeLow, setRangeLow] = useState<number>(1.07900);

  // Actualizar presets de precio cuando cambia el símbolo
  useEffect(() => {
    const asset = ASSET_SPECIFICATIONS[symbol];
    if (asset) {
      if (asset.symbol === 'EURUSD') {
        setEntryPrice(1.08350);
        setStopLossPrice(1.08150);
        setTakeProfitPrice(1.09050);
        setRangeHigh(1.09200);
        setRangeLow(1.07900);
      } else if (asset.symbol === 'GBPUSD') {
        setEntryPrice(1.29300);
        setStopLossPrice(1.29050);
        setTakeProfitPrice(1.30200);
        setRangeHigh(1.30500);
        setRangeLow(1.28800);
      } else if (asset.symbol === 'USDJPY') {
        setEntryPrice(152.100);
        setStopLossPrice(151.700);
        setTakeProfitPrice(153.500);
        setRangeHigh(153.800);
        setRangeLow(151.200);
      } else if (asset.symbol === 'XAUUSD') {
        setEntryPrice(2742.00);
        setStopLossPrice(2736.00);
        setTakeProfitPrice(2762.00);
        setRangeHigh(2770.00);
        setRangeLow(2730.00);
      } else if (asset.symbol === 'US30') {
        setEntryPrice(42100);
        setStopLossPrice(41950);
        setTakeProfitPrice(42580);
        setRangeHigh(42700);
        setRangeLow(41800);
      } else if (asset.symbol === 'NAS100') {
        setEntryPrice(20100);
        setStopLossPrice(20030);
        setTakeProfitPrice(20340);
        setRangeHigh(20400);
        setRangeLow(19980);
      } else if (asset.symbol === 'BTCUSD') {
        setEntryPrice(68200);
        setStopLossPrice(67400);
        setTakeProfitPrice(70800);
        setRangeHigh(71200);
        setRangeLow(66800);
      }
    }
  }, [symbol]);

  // Ejecución del cálculo en tiempo real
  const calcResult = useMemo(() => {
    const input: SmcCalculationInput = {
      symbol,
      direction,
      accountBalance,
      riskPercent,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      rangeHigh,
      rangeLow,
    };
    return calculateSmcPosition(input);
  }, [symbol, direction, accountBalance, riskPercent, entryPrice, stopLossPrice, takeProfitPrice, rangeHigh, rangeLow]);

  // --- ESTADO DEL VALIDADOR DE CONFLUENCIAS ---
  const [sessionKillzone, setSessionKillzone] = useState<SmcValidatorCriteria['sessionKillzone']>('ny_am');
  const [htfBiasAligned, setHtfBiasAligned] = useState<boolean>(true);
  const [liquiditySweepType, setLiquiditySweepType] = useState<SmcValidatorCriteria['liquiditySweepType']>('pdl_pdh');
  const [structureShiftType, setStructureShiftType] = useState<SmcValidatorCriteria['structureShiftType']>('choch_body');
  const [poiType, setPoiType] = useState<SmcValidatorCriteria['poiType']>('virgin_ob_ote');
  const [hasInducementSwept, setHasInducementSwept] = useState<boolean>(true);

  // El validador toma en cuenta el ratio R:R y la zona calculados automáticamente
  const validationReport = useMemo(() => {
    const criteria: SmcValidatorCriteria = {
      sessionKillzone,
      htfBiasAligned,
      liquiditySweepType,
      structureShiftType,
      poiType,
      hasInducementSwept,
      riskRewardAdequate: calcResult.riskRewardRatio >= 2.0,
      isCorrectZone: calcResult.rangeAnalysis.isCorrectZoneForDirection,
    };
    return evaluateSmcSetup(criteria);
  }, [
    sessionKillzone,
    htfBiasAligned,
    liquiditySweepType,
    structureShiftType,
    poiType,
    hasInducementSwept,
    calcResult.riskRewardRatio,
    calcResult.rangeAnalysis.isCorrectZoneForDirection,
  ]);

  // --- BITÁCORA LOCAL (JOURNAL) ---
  const [savedSetups, setSavedSetups] = useState<SavedSmcSetup[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) {
        setSavedSetups(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error loading journal:', e);
    }
  }, []);

  const handleSaveSetup = () => {
    const newEntry: SavedSmcSetup = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      symbol,
      direction,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      lots: calcResult.standardLots,
      riskDollar: calcResult.riskAmountUsd,
      riskReward: calcResult.riskRewardRatio,
      score: validationReport.score,
      grade: validationReport.grade,
    };
    const updated = [newEntry, ...savedSetups];
    setSavedSetups(updated);
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updated));
      setCopyFeedback('¡Setup guardado exitosamente en la bitácora!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (e) {
      console.warn('Error saving setup:', e);
    }
  };

  const handleClearJournal = () => {
    if (window.confirm('¿Deseas vaciar la bitácora de setups guardados?')) {
      setSavedSetups([]);
      localStorage.removeItem(JOURNAL_STORAGE_KEY);
    }
  };

  const handleCopyOrder = () => {
    const text = `=== ORDEN INSTITUCIONAL AL-HADIQA INVEST ===
Activo: ${symbol} (${selectedAsset.name})
Dirección: ${direction === 'BUY' ? 'COMPRA (Long)' : 'VENTA (Short)'}
Entrada: ${entryPrice}
Stop Loss: ${stopLossPrice} (${calcResult.slDistancePips} pips)
Take Profit: ${takeProfitPrice} (${calcResult.tpDistancePips} pips)
Tamaño: ${calcResult.standardLots} Lotes Estándar (${calcResult.miniLots} Minilotes)
Riesgo: $${calcResult.riskAmountUsd} USD (${riskPercent}%)
R:R: 1:${calcResult.riskRewardRatio} | Beneficio Estimado: +$${calcResult.expectedProfitUsd} USD
Zona: ${calcResult.rangeAnalysis.zone} (Equilibrium: ${calcResult.rangeAnalysis.equilibriumPrice})
Score SMC: ${validationReport.score}% (${validationReport.grade})`;

    navigator.clipboard.writeText(text);
    setCopyFeedback('¡Parámetros copiados al portapapeles para MT4/MT5/cTrader!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="smc-calculator-title"
    >
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[880px] bg-[#03140e] border border-amber-500/40 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-slate-100">
        {/* ENCABEZADO PRINCIPAL */}
        <div className="px-5 py-4 border-b border-amber-500/20 bg-gradient-to-r from-[#062319] via-[#093325] to-[#062319] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-[0_0_12px_rgba(212,175,55,0.25)]">
              🧮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="smc-calculator-title" className="font-bold text-base sm:text-lg text-amber-200 tracking-wide">
                  Calculador y Validador SMC Institucional
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  No Simulado · 100% Funcional
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                AL-HADIQA INVEST · Precisión de Lote, Asimetría R:R, Equilibrium &amp; Auditoría Algorítmica de Confluencias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('al_hadiqa_open_feedback', {
                      detail: { category: 'correccion', module: 'calculador_smc' },
                    })
                  );
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-amber-500/30 transition-colors"
              title="Reportar corrección técnica o sugerencia sobre este cálculo"
            >
              <span>📝</span>
              <span className="hidden sm:inline">Enviar Corrección</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-lg"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* SELECTOR DE PESTAÑAS */}
        <div className="px-4 py-2 border-b border-white/5 bg-[#041a13] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_2px_10px_rgba(212,175,55,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🧮</span>
              <span>Calculador de Lote &amp; R:R</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('validator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'validator'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_2px_10px_rgba(16,185,129,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🔍</span>
              <span>Validador de Confluencias ({validationReport.score}%)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-blue-500 text-slate-950 shadow-[0_2px_10px_rgba(59,130,246,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>📓</span>
              <span>Bitácora ({savedSetups.length})</span>
            </button>
          </div>

          {copyFeedback && (
            <div className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-lg animate-in fade-in">
              {copyFeedback}
            </div>
          )}
        </div>

        {/* CONTENEDOR CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ==================================================== */}
          {/* PESTAÑA 1: CALCULADOR SMC MATEMÁTICO REAL           */}
          {/* ==================================================== */}
          {activeTab === 'calculator' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* ALERTA DE INCONSISTENCIA EN TIEMPO REAL */}
              {calcResult.alerts.length > 0 && (
                <div className="space-y-2">
                  {calcResult.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                        alert.type === 'critical'
                          ? 'bg-red-950/40 border-red-500/50 text-red-200'
                          : alert.type === 'warning'
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      }`}
                    >
                      <span className="text-base shrink-0">
                        {alert.type === 'critical' ? '🚫' : alert.type === 'warning' ? '⚠️' : '✅'}
                      </span>
                      <span className="leading-relaxed">{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* GRILLA DE ENTRADA DE PARÁMETROS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Activo */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Instrumento / Par
                  </label>
                  <select
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                  >
                    {Object.values(ASSET_SPECIFICATIONS).map((spec) => (
                      <option key={spec.symbol} value={spec.symbol}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Pip size: {selectedAsset.pipSize} | Contrato: {selectedAsset.contractSize}
                  </span>
                </div>

                {/* 2. Dirección */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tipo de Operación
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDirection('BUY')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        direction === 'BUY'
                          ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      ▲ COMPRA (Long)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('SELL')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        direction === 'SELL'
                          ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      ▼ VENTA (Short)
                    </button>
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {direction === 'BUY' ? 'Requiere entrada en Descuento' : 'Requiere entrada en Prima'}
                  </span>
                </div>

                {/* 3. Balance */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Balance de Cuenta ($ USD)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="100"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Math.max(10, Number(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-1 mt-1.5">
                    {[1000, 5000, 10000, 50000].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setAccountBalance(b)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        ${b >= 1000 ? `${b / 1000}k` : b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Riesgo % */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Riesgo Institucional (%)
                    </label>
                    <span className="text-xs font-bold text-amber-300">${calcResult.riskAmountUsd} USD</span>
                  </div>
                  <input
                    type="number"
                    min="0.1"
                    max="5.0"
                    step="0.25"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Math.max(0.1, Number(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-1 mt-1.5">
                    {[0.5, 1.0, 1.5, 2.0].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRiskPercent(r)}
                        className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer ${
                          riskPercent === r
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE PRECIOS EXACTOS (ENTRY, SL, TP) */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Precio Entrada */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    🎯 Precio de Entrada (Entry)
                  </label>
                  <input
                    type="number"
                    step={selectedAsset.pipSize}
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-base font-bold text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Punto de ejecución en tu Order Block o FVG
                  </span>
                </div>

                {/* Stop Loss */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-red-400">
                      🛑 Stop Loss (SL)
                    </label>
                    <span className="text-xs font-mono text-red-300">{calcResult.slDistancePips} pips</span>
                  </div>
                  <input
                    type="number"
                    step={selectedAsset.pipSize}
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-red-500/50 rounded-lg px-3 py-2 text-base font-bold text-red-300 focus:outline-none focus:border-red-400 font-mono"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Invalidación técnica protegida
                  </span>
                </div>

                {/* Take Profit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-400">
                      🏆 Take Profit (TP)
                    </label>
                    <span className="text-xs font-mono text-emerald-300">{calcResult.tpDistancePips} pips</span>
                  </div>
                  <input
                    type="number"
                    step={selectedAsset.pipSize}
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-base font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Próxima liquidez contraria (BSL / SSL)
                  </span>
                </div>
              </div>

              {/* ANÁLISIS DE DEALING RANGE (EQUILIBRIUM, DISCOUNT VS PREMIUM) */}
              <div className="p-4 rounded-xl bg-[#062319]/80 border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <span>⚖️ Dealing Range SMC &amp; Niveles Fibonacci Institucionales</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          calcResult.rangeAnalysis.zone === 'DISCOUNT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : calcResult.rangeAnalysis.zone === 'PREMIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        Zona {calcResult.rangeAnalysis.zone} ({calcResult.rangeAnalysis.entryRetracementPercent}%)
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Rango de fractal mayor (4H / 1H) para determinar si estás comprando con descuento institucional o cayendo en trampa premium.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Swing Low: </span>
                      <input
                        type="number"
                        step={selectedAsset.pipSize}
                        value={rangeLow}
                        onChange={(e) => setRangeLow(Number(e.target.value) || 0)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">Swing High: </span>
                      <input
                        type="number"
                        step={selectedAsset.pipSize}
                        value={rangeHigh}
                        onChange={(e) => setRangeHigh(Number(e.target.value) || 0)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* BARRA VISUAL DE RANGO SMC */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative h-6 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 flex text-[10px] font-bold">
                    {/* Mitad Discount (0% - 50%) */}
                    <div className="w-1/2 bg-emerald-950/70 border-r border-amber-400/80 flex items-center justify-start px-2 text-emerald-400">
                      DISCOUNT (&lt;50% Compras)
                    </div>
                    {/* Mitad Premium (50% - 100%) */}
                    <div className="w-1/2 bg-amber-950/70 flex items-center justify-end px-2 text-amber-400">
                      PREMIUM (&gt;50% Ventas)
                    </div>

                    {/* Marcador de Entrada */}
                    <div
                      className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff]"
                      style={{
                        left: `${Math.min(100, Math.max(0, calcResult.rangeAnalysis.entryRetracementPercent))}%`,
                      }}
                      title={`Entrada al ${calcResult.rangeAnalysis.entryRetracementPercent}%`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Low: {Math.min(rangeHigh, rangeLow)}</span>
                    <span className="text-amber-300 font-bold">
                      Equilibrium (50%): {calcResult.rangeAnalysis.equilibriumPrice}
                    </span>
                    <span>High: {Math.max(rangeHigh, rangeLow)}</span>
                  </div>

                  {/* Niveles OTE Clave */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs text-center font-mono">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Fib 61.8% OTE</span>
                      <strong className="text-slate-200">{calcResult.rangeAnalysis.fibLevels.ote618}</strong>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-amber-500/40">
                      <span className="text-[10px] text-amber-400 block font-bold">Fib 70.5% (Sweet Spot)</span>
                      <strong className="text-amber-200">{calcResult.rangeAnalysis.fibLevels.ote705}</strong>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Fib 79.0% Deep OTE</span>
                      <strong className="text-slate-200">{calcResult.rangeAnalysis.fibLevels.ote790}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* PANEL DE RESULTADOS MATEMÁTICOS DE EJECUCIÓN */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#062319] via-[#093325] to-[#041d14] border-2 border-emerald-500/60 shadow-[0_15px_40px_rgba(16,185,129,0.18)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Lotes Estándar
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono">
                    {calcResult.standardLots}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {calcResult.miniLots} mini | {calcResult.microLots} micro
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Riesgo Monetario
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-red-400 mt-1 font-mono">
                    ${calcResult.riskAmountUsd}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {riskPercent}% de ${accountBalance}
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Ratio Riesgo:Beneficio
                  </div>
                  <div
                    className={`text-2xl sm:text-3xl font-black mt-1 font-mono ${
                      calcResult.riskRewardRatio >= 3.0
                        ? 'text-amber-300'
                        : calcResult.riskRewardRatio >= 2.0
                        ? 'text-emerald-300'
                        : 'text-red-400'
                    }`}
                  >
                    1:{calcResult.riskRewardRatio}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Break-even: {calcResult.breakevenWinratePercent}%
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Beneficio Estimado
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 font-mono">
                    +${calcResult.expectedProfitUsd}
                  </div>
                  <div className="text-[11px] text-amber-200/80 mt-0.5">
                    +{Number((riskPercent * calcResult.riskRewardRatio).toFixed(1))}% a la cuenta
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN DE LA CALCULADORA */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyOrder}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#03140e] bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all cursor-pointer shadow-[0_4px_14px_rgba(212,175,55,0.35)] flex items-center gap-1.5"
                  >
                    <span>📋</span>
                    <span>Copiar Parámetros para MT4 / MT5</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSetup}
                    className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>💾</span>
                    <span>Guardar en Bitácora</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('validator')}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_4px_14px_rgba(16,185,129,0.3)] ml-auto"
                >
                  <span>Validar Confluencias SMC de este Trade</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* PESTAÑA 2: VALIDADOR DE CONFLUENCIAS SMC REAL        */}
          {/* ==================================================== */}
          {activeTab === 'validator' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* TARJETA DE VEREDICTO INSTITUCIONAL PRINCIPAL */}
              <div
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-2 shadow-2xl flex flex-col sm:flex-row items-center gap-5 sm:gap-6"
                style={{ borderColor: validationReport.gradeColor }}
              >
                {/* Score Circular */}
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    background: `conic-gradient(${validationReport.gradeColor} ${validationReport.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                  }}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#03140e] flex flex-col items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-black font-mono" style={{ color: validationReport.gradeColor }}>
                      {validationReport.score}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Score SMC</span>
                  </div>
                </div>

                {/* Texto del veredicto */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-black"
                      style={{ backgroundColor: validationReport.gradeColor }}
                    >
                      {validationReport.grade}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Operación: {symbol} · {direction} · R:R 1:{calcResult.riskRewardRatio}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-200 leading-snug">
                    {validationReport.verdictSummary}
                  </p>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                    <span>
                      Zona: <strong className={calcResult.rangeAnalysis.isCorrectZoneForDirection ? 'text-emerald-400' : 'text-red-400'}>
                        {calcResult.rangeAnalysis.zone}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Sesgo 4H: <strong className={htfBiasAligned ? 'text-emerald-400' : 'text-red-400'}>
                        {htfBiasAligned ? 'Alineado' : 'Contratendencia'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Killzone: <strong className="text-amber-300">{sessionKillzone.toUpperCase()}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* LISTA DE CONFLUENCIAS Y CRITERIOS AUDITABLES */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider">
                  Auditoría Estructural de los 7 Factores Algorítmicos
                </h3>

                {/* 1. Sesión y Killzone */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      1. Horario &amp; Killzone Institucional
                    </span>
                    <span className="text-xs font-mono text-amber-400">
                      {sessionKillzone === 'ny_am' || sessionKillzone === 'london_open' ? '15/15 pts' : '10/15 pts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'london_open', label: 'Londres (08:00 - 11:00 UTC)', desc: 'Expansión' },
                      { id: 'ny_am', label: 'Nueva York AM (13:00 - 16:00 UTC)', desc: 'Volumen Top' },
                      { id: 'ny_pm', label: 'Nueva York PM (18:00 - 20:00 UTC)', desc: 'Cierre' },
                      { id: 'asian_off', label: 'Fuera de Killzone', desc: 'Riesgo Spread' },
                    ].map((kz) => (
                      <button
                        key={kz.id}
                        type="button"
                        onClick={() => setSessionKillzone(kz.id as any)}
                        className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                          sessionKillzone === kz.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold">{kz.label}</div>
                        <div className="text-[10px] text-slate-400">{kz.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Sesgo HTF */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      2. Sesgo en Temporalidad Mayor (HTF Bias: 4H / Diario)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ¿La operación va a favor de la estructura de mercado institucional en 4H?
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={htfBiasAligned}
                      onChange={(e) => setHtfBiasAligned(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* 3. Barrido de Liquidez */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      3. Toma / Barrido de Liquidez Previa (Liquidity Sweep)
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      {liquiditySweepType === 'none' ? '0/15 pts' : '15/15 pts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    {[
                      { id: 'pdl_pdh', label: 'PDH / PDL', desc: 'Máximo/Mínimo Ayer' },
                      { id: 'asian_sweep', label: 'Rango Asiático', desc: 'Judas Swing' },
                      { id: 'eqh_eql', label: 'EQH / EQL', desc: 'Iguales' },
                      { id: 'minor_sweep', label: 'Swing Menor', desc: 'Interno' },
                      { id: 'none', label: 'Sin Barrido', desc: '🚫 Peligro' },
                    ].map((sw) => (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => setLiquiditySweepType(sw.id as any)}
                        className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                          liquiditySweepType === sw.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold">{sw.label}</div>
                        <div className="text-[10px] text-slate-400">{sw.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Quiebre de Estructura */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      4. Confirmación Estructural (BOS / CHoCH)
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      {structureShiftType === 'choch_body' || structureShiftType === 'bos_body' ? '15/15 pts' : '5/15 pts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'choch_body', label: 'CHoCH (Cuerpo de Vela)', desc: 'Giro confirmado' },
                      { id: 'bos_body', label: 'BOS (Cuerpo de Vela)', desc: 'Continuación' },
                      { id: 'wick_only', label: 'Solo Mecha / Wick', desc: 'Sin compromiso' },
                      { id: 'none', label: 'Sin Quiebre', desc: '🚫 Inválido' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStructureShiftType(st.id as any)}
                        className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                          structureShiftType === st.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold">{st.label}</div>
                        <div className="text-[10px] text-slate-400">{st.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Punto de Interés (POI) */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      5. Punto de Interés Institucional (POI)
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      {poiType === 'virgin_ob_ote' || poiType === 'fvg_50ce' ? '15/15 pts' : '10/15 pts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'virgin_ob_ote', label: 'Order Block Virgen en OTE', desc: '61.8% - 79%' },
                      { id: 'fvg_50ce', label: 'Fair Value Gap (50% CE)', desc: 'Imbalance' },
                      { id: 'breaker_block', label: 'Breaker Block', desc: 'Ruptura previa' },
                      { id: 'retail_support', label: 'Soporte Retail Clásico', desc: '🚫 Trampa' },
                    ].map((poi) => (
                      <button
                        key={poi.id}
                        type="button"
                        onClick={() => setPoiType(poi.id as any)}
                        className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                          poiType === poi.id
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold">{poi.label}</div>
                        <div className="text-[10px] text-slate-400">{poi.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Inducción previa (Inducement / IDM) */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      6. Inducción Previa Consumida (Inducement / IDM)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ¿Existe un máximo o mínimo falso que el mercado ya barrió justo antes de tocar tu zona POI?
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={hasInducementSwept}
                      onChange={(e) => setHasInducementSwept(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* PLAN DE ACCIÓN TÉCNICO SUGERIDO */}
              <div className="p-4 rounded-xl bg-[#062319]/90 border border-emerald-500/40 space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🧭</span>
                  <span>Plan de Ejecución Institucional Recomendado</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {validationReport.actionPlan.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* BOTONES DE ACCIÓN DEL VALIDADOR */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSetup}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>Guardar Resultado en Bitácora</span>
                </button>

                {onConsultMentor && (
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = `Hola Maestro. Acabo de auditar mi setup en el Validador SMC:
Activo: ${symbol} (${direction})
Score SMC: ${validationReport.score}% (${validationReport.grade})
Ratio R:R: 1:${calcResult.riskRewardRatio}
Zona: ${calcResult.rangeAnalysis.zone}
Killzone: ${sessionKillzone}
Quiebre: ${structureShiftType}
POI: ${poiType}
¿Qué recomendaciones adicionales tienes para refinar mi entrada y gestionar mi Take Profit según Smart Money Concepts?`;
                      onClose();
                      onConsultMentor(prompt);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#03140e] bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all cursor-pointer shadow-[0_4px_14px_rgba(212,175,55,0.35)] flex items-center gap-1.5"
                  >
                    <span>🦁</span>
                    <span>Consultar Diagnóstico con el Mentor Maestro</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* PESTAÑA 3: BITÁCORA DE SETUPS (JOURNAL)              */}
          {/* ==================================================== */}
          {activeTab === 'journal' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Bitácora Histórica de Setups Validados
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registro de operaciones calculadas y auditadas para medir tu disciplina institucional.
                  </p>
                </div>
                {savedSetups.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearJournal}
                    className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
                  >
                    Vaciar bitácora
                  </button>
                )}
              </div>

              {savedSetups.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                  <span className="text-3xl block">📓</span>
                  <div className="text-sm font-semibold text-slate-300">
                    Aún no tienes setups guardados en tu bitácora
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Utiliza la pestaña de Calculador o Validador y presiona <strong>«Guardar en Bitácora»</strong> para almacenar tus análisis y llevar un historial real.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedSetups.map((setup) => (
                    <div
                      key={setup.id}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            setup.direction === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {setup.direction === 'BUY' ? '▲' : '▼'}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                            <span>{setup.symbol}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{setup.timestamp}</span>
                          </div>
                          <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                            Entrada: {setup.entryPrice} | SL: {setup.stopLossPrice} | TP: {setup.takeProfitPrice}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="font-bold text-amber-300 font-mono">
                            {setup.lots} Lotes (R:R 1:{setup.riskReward})
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            Riesgo: ${setup.riskDollar} USD
                          </div>
                        </div>

                        <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                          {setup.score}% ({setup.grade})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
