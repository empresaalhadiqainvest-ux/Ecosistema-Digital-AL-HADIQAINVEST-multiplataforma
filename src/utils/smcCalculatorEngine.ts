/**
 * Motor Matemático y Técnico de Smart Money Concepts (SMC) de AL-HADIQA INVEST
 * Motor 100% real, no simulado, basado en especificaciones exactas de contrato,
 * cálculo de pips por decimal, dealing range, zona de descuento/prima (Equilibrium) y checklist institucional.
 */

export type AssetCategory = 'forex_major' | 'forex_jpy' | 'metal' | 'index' | 'crypto';

export interface AssetSpecification {
  symbol: string;
  name: string;
  category: AssetCategory;
  pipSize: number; // e.g. 0.0001 for EURUSD, 0.01 for USDJPY, 0.1 for XAUUSD, 1.0 for US30
  pipDecimals: number;
  contractSize: number; // units per standard lot
  standardPipValueUsd: number; // Approximate USD value of 1 pip for 1.00 lot
  typicalSpreadPips: number;
  samplePrice: number;
}

export const ASSET_SPECIFICATIONS: Record<string, AssetSpecification> = {
  EURUSD: {
    symbol: 'EURUSD',
    name: 'EUR/USD (Euro / Dólar Estadounidense)',
    category: 'forex_major',
    pipSize: 0.0001,
    pipDecimals: 5,
    contractSize: 100000,
    standardPipValueUsd: 10.0,
    typicalSpreadPips: 0.1,
    samplePrice: 1.08500,
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'GBP/USD (Libra Esterlina / Dólar)',
    category: 'forex_major',
    pipSize: 0.0001,
    pipDecimals: 5,
    contractSize: 100000,
    standardPipValueUsd: 10.0,
    typicalSpreadPips: 0.3,
    samplePrice: 1.29450,
  },
  USDJPY: {
    symbol: 'USDJPY',
    name: 'USD/JPY (Dólar / Yen Japonés)',
    category: 'forex_jpy',
    pipSize: 0.01,
    pipDecimals: 3,
    contractSize: 100000,
    standardPipValueUsd: 6.80, // Calculado a 147.00
    typicalSpreadPips: 0.2,
    samplePrice: 152.400,
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    name: 'GBP/JPY (Libra Esterlina / Yen Japonés)',
    category: 'forex_jpy',
    pipSize: 0.01,
    pipDecimals: 3,
    contractSize: 100000,
    standardPipValueUsd: 6.80,
    typicalSpreadPips: 0.6,
    samplePrice: 196.850,
  },
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'XAU/USD (Oro Spot / Dólar)',
    category: 'metal',
    pipSize: 0.10, // 1 pip = $0.10 de precio en oro; $1.00 = 10 pips / 1 punto
    pipDecimals: 2,
    contractSize: 100, // 100 oz troy
    standardPipValueUsd: 10.0, // 1 pip (0.10) en 1 lote (100 oz) = $10 USD
    typicalSpreadPips: 0.8,
    samplePrice: 2740.50,
  },
  US30: {
    symbol: 'US30',
    name: 'US30 (Dow Jones Industrial Average)',
    category: 'index',
    pipSize: 1.0, // 1 punto
    pipDecimals: 1,
    contractSize: 1,
    standardPipValueUsd: 1.0, // $1 por punto por contrato
    typicalSpreadPips: 1.5,
    samplePrice: 42150.0,
  },
  NAS100: {
    symbol: 'NAS100',
    name: 'NAS100 (Nasdaq 100 Tech Index)',
    category: 'index',
    pipSize: 1.0,
    pipDecimals: 1,
    contractSize: 1,
    standardPipValueUsd: 1.0,
    typicalSpreadPips: 1.0,
    samplePrice: 20120.0,
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    name: 'BTC/USD (Bitcoin Spot / Perpetuo)',
    category: 'crypto',
    pipSize: 1.0,
    pipDecimals: 2,
    contractSize: 1,
    standardPipValueUsd: 1.0,
    typicalSpreadPips: 5.0,
    samplePrice: 68500.0,
  },
};

export type TradeDirection = 'BUY' | 'SELL';

export interface SmcCalculationInput {
  symbol: string;
  direction: TradeDirection;
  accountBalance: number;
  riskPercent: number; // e.g. 1.0
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  // Dealing Range (Rango operativo del fractal mayor para Premium vs Discount)
  rangeHigh: number;
  rangeLow: number;
}

export interface FibonacciLevels {
  equilibrium: number; // 50%
  ote618: number; // 61.8%
  ote705: number; // 70.5% (Sweet Spot)
  ote790: number; // 79.0%
}

export interface InconsistencyAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
}

export interface SmcCalculationResult {
  asset: AssetSpecification;
  direction: TradeDirection;
  riskAmountUsd: number;
  slDistancePips: number;
  tpDistancePips: number;
  riskRewardRatio: number; // e.g. 3.25
  breakevenWinratePercent: number; // e.g. 23.5%
  expectedProfitUsd: number;
  // Position sizes
  standardLots: number;
  miniLots: number;
  microLots: number;
  pipValuePerLot: number;
  // SMC Range Analysis
  rangeAnalysis: {
    rangeSizePips: number;
    equilibriumPrice: number;
    fibLevels: FibonacciLevels;
    entryRetracementPercent: number; // 0 to 100% from Low to High
    zone: 'DISCOUNT' | 'PREMIUM' | 'EQUILIBRIUM';
    isCorrectZoneForDirection: boolean;
  };
  isValidParameters: boolean;
  alerts: InconsistencyAlert[];
}

export function calculateSmcPosition(input: SmcCalculationInput): SmcCalculationResult {
  const asset = ASSET_SPECIFICATIONS[input.symbol] || ASSET_SPECIFICATIONS.EURUSD;
  const { direction, accountBalance, riskPercent, entryPrice, stopLossPrice, takeProfitPrice, rangeHigh, rangeLow } = input;

  const alerts: InconsistencyAlert[] = [];
  const riskAmountUsd = Math.max(0, (accountBalance * (riskPercent / 100)));

  // Verificación de dirección y precios
  let slDistancePips = 0;
  let tpDistancePips = 0;
  let isValidParameters = true;

  if (entryPrice <= 0 || stopLossPrice <= 0 || takeProfitPrice <= 0) {
    isValidParameters = false;
    alerts.push({
      type: 'critical',
      message: 'Los precios de Entrada, Stop Loss y Take Profit deben ser valores positivos mayores a cero.',
    });
  }

  if (direction === 'BUY') {
    if (stopLossPrice >= entryPrice) {
      isValidParameters = false;
      alerts.push({
        type: 'critical',
        message: 'Para una posición de COMPRA (Long), el Stop Loss debe situarse estrictamente por debajo del precio de entrada.',
      });
    } else {
      slDistancePips = Number(((entryPrice - stopLossPrice) / asset.pipSize).toFixed(1));
    }

    if (takeProfitPrice <= entryPrice) {
      isValidParameters = false;
      alerts.push({
        type: 'critical',
        message: 'Para una posición de COMPRA (Long), el Take Profit debe situarse estrictamente por encima del precio de entrada.',
      });
    } else {
      tpDistancePips = Number(((takeProfitPrice - entryPrice) / asset.pipSize).toFixed(1));
    }
  } else {
    // SELL
    if (stopLossPrice <= entryPrice) {
      isValidParameters = false;
      alerts.push({
        type: 'critical',
        message: 'Para una posición de VENTA (Short), el Stop Loss debe situarse estrictamente por encima del precio de entrada.',
      });
    } else {
      slDistancePips = Number(((stopLossPrice - entryPrice) / asset.pipSize).toFixed(1));
    }

    if (takeProfitPrice >= entryPrice) {
      isValidParameters = false;
      alerts.push({
        type: 'critical',
        message: 'Para una posición de VENTA (Short), el Take Profit debe situarse estrictamente por debajo del precio de entrada.',
      });
    } else {
      tpDistancePips = Number(((entryPrice - takeProfitPrice) / asset.pipSize).toFixed(1));
    }
  }

  // R:R Ratio
  let riskRewardRatio = 0;
  let breakevenWinratePercent = 0;
  let expectedProfitUsd = 0;

  if (slDistancePips > 0 && tpDistancePips > 0) {
    riskRewardRatio = Number((tpDistancePips / slDistancePips).toFixed(2));
    breakevenWinratePercent = Number(((1 / (1 + riskRewardRatio)) * 100).toFixed(1));
    expectedProfitUsd = Number((riskAmountUsd * riskRewardRatio).toFixed(2));

    if (riskRewardRatio < 1.8) {
      alerts.push({
        type: 'warning',
        message: `Ratio Riesgo/Beneficio insuficiente (${riskRewardRatio}:1). En SMC Institucional la regla inquebrantable exige mínimo 1:2 o preferiblemente 1:3.`,
      });
    } else if (riskRewardRatio >= 3.0) {
      alerts.push({
        type: 'info',
        message: `Ratio R:R Excelente (${riskRewardRatio}:1). Con esta asimetría solo requieres un ${breakevenWinratePercent}% de acierto para ser rentable a largo plazo.`,
      });
    }
  }

  // Cálculo de lotaje exacto
  let standardLots = 0;
  let miniLots = 0;
  let microLots = 0;
  const pipValuePerLot = asset.standardPipValueUsd;

  if (slDistancePips > 0 && riskAmountUsd > 0 && pipValuePerLot > 0) {
    const rawLots = riskAmountUsd / (slDistancePips * pipValuePerLot);
    standardLots = Number(rawLots.toFixed(2));
    miniLots = Number((standardLots * 10).toFixed(1));
    microLots = Number((standardLots * 100).toFixed(0));

    if (standardLots < 0.01) {
      alerts.push({
        type: 'warning',
        message: 'El capital arriesgado resulta en un tamaño menor a 0.01 lotes. Considera ampliar el balance o utilizar una cuenta Micro/Cent.',
      });
      standardLots = 0.01;
    }
  }

  // Análisis de Rango Operativo (Dealing Range) SMC
  const effectiveHigh = Math.max(rangeHigh, rangeLow);
  const effectiveLow = Math.min(rangeHigh, rangeLow);
  const rangeSpan = effectiveHigh - effectiveLow;
  const rangeSizePips = rangeSpan > 0 ? Number((rangeSpan / asset.pipSize).toFixed(1)) : 0;
  const equilibriumPrice = Number(((effectiveHigh + effectiveLow) / 2).toFixed(asset.pipDecimals));

  // Niveles OTE (Fibonacci Institucional)
  // Para compras medimos desde Low hasta High; para ventas desde High hasta Low
  const fibLevels: FibonacciLevels = {
    equilibrium: equilibriumPrice,
    ote618: direction === 'BUY'
      ? Number((effectiveHigh - rangeSpan * 0.618).toFixed(asset.pipDecimals))
      : Number((effectiveLow + rangeSpan * 0.618).toFixed(asset.pipDecimals)),
    ote705: direction === 'BUY'
      ? Number((effectiveHigh - rangeSpan * 0.705).toFixed(asset.pipDecimals))
      : Number((effectiveLow + rangeSpan * 0.705).toFixed(asset.pipDecimals)),
    ote790: direction === 'BUY'
      ? Number((effectiveHigh - rangeSpan * 0.790).toFixed(asset.pipDecimals))
      : Number((effectiveLow + rangeSpan * 0.790).toFixed(asset.pipDecimals)),
  };

  let entryRetracementPercent = 50;
  let zone: 'DISCOUNT' | 'PREMIUM' | 'EQUILIBRIUM' = 'EQUILIBRIUM';
  let isCorrectZoneForDirection = true;

  if (rangeSpan > 0 && entryPrice >= effectiveLow && entryPrice <= effectiveHigh) {
    entryRetracementPercent = Number((((entryPrice - effectiveLow) / rangeSpan) * 100).toFixed(1));

    if (entryPrice < equilibriumPrice - asset.pipSize * 2) {
      zone = 'DISCOUNT';
    } else if (entryPrice > equilibriumPrice + asset.pipSize * 2) {
      zone = 'PREMIUM';
    } else {
      zone = 'EQUILIBRIUM';
    }

    if (direction === 'BUY') {
      if (zone === 'PREMIUM') {
        isCorrectZoneForDirection = false;
        alerts.push({
          type: 'critical',
          message: `Inconsistencia SMC Severa: Estás ejecutando una COMPRA en Zona Premium (${entryRetracementPercent}% del rango). Las instituciones venden en Premium; comprar aquí te convierte en la liquidez de salida de los bancos.`,
        });
      } else if (zone === 'DISCOUNT') {
        alerts.push({
          type: 'info',
          message: `Zona Validada: Entrada en Zona de Descuento (${entryRetracementPercent}% del rango). Precio óptimo para acumulación institucional.`,
        });
      }
    } else {
      // SELL
      if (zone === 'DISCOUNT') {
        isCorrectZoneForDirection = false;
        alerts.push({
          type: 'critical',
          message: `Inconsistencia SMC Severa: Estás ejecutando una VENTA en Zona de Descuento (${entryRetracementPercent}% del rango). Las instituciones compran barato; vender en Discount suele ser atrapado por rebotes agresivos.`,
        });
      } else if (zone === 'PREMIUM') {
        alerts.push({
          type: 'info',
          message: `Zona Validada: Entrada en Zona Premium (${entryRetracementPercent}% del rango). Precio óptimo para distribución y ventas institucionales.`,
        });
      }
    }
  }

  return {
    asset,
    direction,
    riskAmountUsd: Number(riskAmountUsd.toFixed(2)),
    slDistancePips,
    tpDistancePips,
    riskRewardRatio,
    breakevenWinratePercent,
    expectedProfitUsd,
    standardLots,
    miniLots,
    microLots,
    pipValuePerLot,
    rangeAnalysis: {
      rangeSizePips,
      equilibriumPrice,
      fibLevels,
      entryRetracementPercent,
      zone,
      isCorrectZoneForDirection,
    },
    isValidParameters,
    alerts,
  };
}

// Checklist Institucional & Validación Ponderada
export interface SmcValidatorCriteria {
  // 1. Sesión y Killzone
  sessionKillzone: 'ny_am' | 'london_open' | 'ny_pm' | 'asian_off';
  // 2. Sesgo en temporalidad mayor
  htfBiasAligned: boolean;
  // 3. Barrido de Liquidez
  liquiditySweepType: 'pdl_pdh' | 'asian_sweep' | 'eqh_eql' | 'minor_sweep' | 'none';
  // 4. Quiebre de Estructura
  structureShiftType: 'choch_body' | 'bos_body' | 'wick_only' | 'none';
  // 5. Punto de Interés (POI)
  poiType: 'virgin_ob_ote' | 'fvg_50ce' | 'breaker_block' | 'retail_support';
  // 6. Inducción previa (Inducement / IDM)
  hasInducementSwept: boolean;
  // 7. Relación Riesgo-Beneficio >= 1:2.5
  riskRewardAdequate: boolean;
  // 8. Zona Discount/Premium correcta
  isCorrectZone: boolean;
}

export interface SmcValidationReport {
  score: number; // 0 - 100
  grade: 'A+ Institucional' | 'B Confluente' | 'C Riesgoso' | 'RECHAZADO / INVÁLIDO';
  gradeColor: string;
  verdictSummary: string;
  breakdown: {
    category: string;
    pointsAwarded: number;
    maxPoints: number;
    status: 'passed' | 'warning' | 'failed';
    comment: string;
  }[];
  actionPlan: string[];
}

export function evaluateSmcSetup(criteria: SmcValidatorCriteria): SmcValidationReport {
  let totalScore = 0;
  const breakdown: SmcValidationReport['breakdown'] = [];
  const actionPlan: string[] = [];

  // 1. Killzone
  let sessionPoints = 0;
  let sessionComment = '';
  let sessionStatus: 'passed' | 'warning' | 'failed' = 'passed';
  if (criteria.sessionKillzone === 'ny_am') {
    sessionPoints = 15;
    sessionComment = 'Killzone Nueva York AM (Máximo volumen y participación de creadores de mercado).';
  } else if (criteria.sessionKillzone === 'london_open') {
    sessionPoints = 15;
    sessionComment = 'Killzone Londres (Expansión algorítmica y alta volatilidad europea).';
  } else if (criteria.sessionKillzone === 'ny_pm') {
    sessionPoints = 10;
    sessionComment = 'Sesión Tarde NY (Continuación o toma de beneficios institucional).';
  } else {
    sessionPoints = 3;
    sessionStatus = 'warning';
    sessionComment = 'Fuera de Killzone (Riesgo de falsos quiebres, spreads ampliados y bajo momentum).';
  }
  totalScore += sessionPoints;
  breakdown.push({
    category: '1. Horario & Killzone Operativa',
    pointsAwarded: sessionPoints,
    maxPoints: 15,
    status: sessionStatus,
    comment: sessionComment,
  });

  // 2. Sesgo HTF
  let htfPoints = criteria.htfBiasAligned ? 20 : 0;
  let htfStatus: 'passed' | 'failed' = criteria.htfBiasAligned ? 'passed' : 'failed';
  totalScore += htfPoints;
  breakdown.push({
    category: '2. Sesgo en Temporalidad Mayor (4H / Diario)',
    pointsAwarded: htfPoints,
    maxPoints: 20,
    status: htfStatus,
    comment: criteria.htfBiasAligned
      ? 'Alineado con el flujo de órdenes institucional (Pro-Orderflow).'
      : 'Contratendencia severa. Operar en contra de 4H reduce la tasa de acierto en un 60%.',
  });

  // 3. Barrido de Liquidez
  let sweepPoints = 0;
  let sweepStatus: 'passed' | 'warning' | 'failed' = 'passed';
  let sweepComment = '';
  if (criteria.liquiditySweepType === 'pdl_pdh') {
    sweepPoints = 15;
    sweepComment = 'Barrido mayor de PDH/PDL (Previous Day High/Low). Combustible institucional de primer orden.';
  } else if (criteria.liquiditySweepType === 'asian_sweep') {
    sweepPoints = 15;
    sweepComment = 'Barrido del rango asiático (Judas Swing institucional clásico de apertura).';
  } else if (criteria.liquiditySweepType === 'eqh_eql') {
    sweepPoints = 12;
    sweepComment = 'Barrido de Equal Highs/Lows (Toma de stops acumulados del retail).';
  } else if (criteria.liquiditySweepType === 'minor_sweep') {
    sweepPoints = 7;
    sweepStatus = 'warning';
    sweepComment = 'Barrido de fractal menor interno. Confluencia moderada.';
  } else {
    sweepPoints = 0;
    sweepStatus = 'failed';
    sweepComment = 'Sin barrido de liquidez previo. Las órdenes bancarias necesitan absorber contrapartida; entrar sin sweep es apostar.';
  }
  totalScore += sweepPoints;
  breakdown.push({
    category: '3. Barrido de Liquidez (Liquidity Sweep)',
    pointsAwarded: sweepPoints,
    maxPoints: 15,
    status: sweepStatus,
    comment: sweepComment,
  });

  // 4. Quiebre de Estructura (MSS / CHoCH)
  let structPoints = 0;
  let structStatus: 'passed' | 'warning' | 'failed' = 'passed';
  let structComment = '';
  if (criteria.structureShiftType === 'choch_body') {
    structPoints = 15;
    structComment = 'CHoCH contundente con cuerpo de vela confirmado (Validación de cambio de control).';
  } else if (criteria.structureShiftType === 'bos_body') {
    structPoints = 14;
    structComment = 'BOS estructural confirmado con cierre de cuerpo de vela a favor de la tendencia.';
  } else if (criteria.structureShiftType === 'wick_only') {
    structPoints = 5;
    structStatus = 'warning';
    structComment = 'Quiebre solo con mecha. Posible rechazo o trampa de inducción sin compromiso institucional.';
  } else {
    structPoints = 0;
    structStatus = 'failed';
    structComment = 'Estructura intacta en contra. No existe confirmación técnica de entrada.';
  }
  totalScore += structPoints;
  breakdown.push({
    category: '4. Quiebre Estructural (BOS / CHoCH)',
    pointsAwarded: structPoints,
    maxPoints: 15,
    status: structStatus,
    comment: structComment,
  });

  // 5. Punto de Interés (POI)
  let poiPoints = 0;
  let poiStatus: 'passed' | 'warning' | 'failed' = 'passed';
  let poiComment = '';
  if (criteria.poiType === 'virgin_ob_ote') {
    poiPoints = 15;
    poiComment = 'Order Block no mitigado con desbalance previo situado en zona OTE (61.8% - 79%).';
  } else if (criteria.poiType === 'fvg_50ce') {
    poiPoints = 14;
    poiComment = 'Fair Value Gap (FVG) no mitigado respetando el 50% Consequent Encroachment.';
  } else if (criteria.poiType === 'breaker_block') {
    poiPoints = 10;
    poiStatus = 'warning';
    poiComment = 'Breaker Block (Bloque de ruptura). Confluencia secundaria de retroceso.';
  } else {
    poiPoints = 0;
    poiStatus = 'failed';
    poiComment = 'Soporte/Resistencia retail convencional sin sustento en desbalance o flujo institucional.';
  }
  totalScore += poiPoints;
  breakdown.push({
    category: '5. Zona de Entrada / POI Institucional',
    pointsAwarded: poiPoints,
    maxPoints: 15,
    status: poiStatus,
    comment: poiComment,
  });

  // 6. Inducción previa (Inducement)
  let idmPoints = criteria.hasInducementSwept ? 10 : 0;
  totalScore += idmPoints;
  breakdown.push({
    category: '6. Inducción Previa (Inducement / IDM)',
    pointsAwarded: idmPoints,
    maxPoints: 10,
    status: criteria.hasInducementSwept ? 'passed' : 'warning',
    comment: criteria.hasInducementSwept
      ? 'La trampa minorista previa ya fue consumida antes de llegar a tu POI.'
      : 'Atención: Tu POI podría ser la propia inducción (IDM) del movimiento mayor.',
  });

  // 7. Ratio R:R & Asimetría
  let rrPoints = criteria.riskRewardAdequate ? 10 : 0;
  totalScore += rrPoints;
  breakdown.push({
    category: '7. Ratio Riesgo/Beneficio Mínimo 1:2.5',
    pointsAwarded: rrPoints,
    maxPoints: 10,
    status: criteria.riskRewardAdequate ? 'passed' : 'failed',
    comment: criteria.riskRewardAdequate
      ? 'Ventaja matemática sólida con asimetría positiva.'
      : 'Ratio deficiente. No arriesgues capital si el objetivo no paga al menos el doble del riesgo.',
  });

  // Determinación de veredicto
  let grade: SmcValidationReport['grade'] = 'RECHAZADO / INVÁLIDO';
  let gradeColor = '#ef4444';
  let verdictSummary = '';

  if (totalScore >= 85 && criteria.isCorrectZone && criteria.htfBiasAligned) {
    grade = 'A+ Institucional';
    gradeColor = '#10b981';
    verdictSummary = 'SETUP INSTITUCIONAL ÓPTIMO (Alta Probabilidad). Cumple con todas las confluencias algorítmicas de SMC. Aprobado para ejecución con riesgo estándar (1.0% - 1.5%).';
    actionPlan.push('Colocar orden límite (Buy/Sell Limit) en la zona de POI con Stop Loss protegido tras el punto de invalidación.');
    actionPlan.push('Fijar Take Profit 1 en el 50% de la liquidez opuesta y Take Profit 2 en el extremo del rango.');
    actionPlan.push('Pasar la operación a Break-Even únicamente cuando el precio rompa con cuerpo el primer fractal interno.');
  } else if (totalScore >= 70 && criteria.isCorrectZone) {
    grade = 'B Confluente';
    gradeColor = '#3b82f6';
    verdictSummary = 'SETUP VÁLIDO CON PRECAUCIÓN. Confluencias respetables pero presenta 1 o 2 factores no ideales (Killzone o falta de inducción).';
    actionPlan.push('Reducir el riesgo por trade a la mitad (0.50% de la cuenta).');
    actionPlan.push('Esperar confirmación en 1 minuto (M1) o 5 minutos (M5) en lugar de entrar por orden límite ciega.');
  } else if (totalScore >= 50) {
    grade = 'C Riesgoso';
    gradeColor = '#f59e0b';
    verdictSummary = 'SETUP DE ALTO RIESGO. Faltan confluencias críticas. Mayor probabilidad de ser utilizado como liquidez por las instituciones.';
    actionPlan.push('No arriesgar capital real. Esperar un nuevo barrido de liquidez o un quiebre estructural más limpio.');
    actionPlan.push('Revisar si el precio está dentro de una zona de rango o trampa asiática.');
  } else {
    grade = 'RECHAZADO / INVÁLIDO';
    gradeColor = '#ef4444';
    verdictSummary = 'OPERACIÓN INVALIDADA. Viola principios esenciales de Smart Money Concepts o presenta ratio desfavorable.';
    actionPlan.push('Abortar la operación inmediatamente.');
    actionPlan.push('Esperar a la apertura de la siguiente Killzone oficial.');
  }

  return {
    score: totalScore,
    grade,
    gradeColor,
    verdictSummary,
    breakdown,
    actionPlan,
  };
}
