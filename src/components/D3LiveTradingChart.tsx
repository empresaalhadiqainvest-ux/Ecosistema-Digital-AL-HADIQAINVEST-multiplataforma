import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

export interface CandleData {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  smcType?: 'OB_BULL' | 'OB_BEAR' | 'FVG' | 'LIQ_SWEEP';
}

interface AssetConfig {
  name: string;
  symbol: string;
  basePrice: number;
  pipDecimals: number;
  volatility: number;
  unit: string;
}

const ASSETS: Record<string, AssetConfig> = {
  XAUUSD: {
    name: 'Oro Spot vs Dólar',
    symbol: 'XAU/USD',
    basePrice: 2684.50,
    pipDecimals: 2,
    volatility: 1.8,
    unit: 'USD',
  },
  EURUSD: {
    name: 'Euro vs Dólar USA',
    symbol: 'EUR/USD',
    basePrice: 1.0865,
    pipDecimals: 4,
    volatility: 0.0006,
    unit: 'USD',
  },
  BTCUSDT: {
    name: 'Bitcoin vs Tether',
    symbol: 'BTC/USDT',
    basePrice: 68420.0,
    pipDecimals: 1,
    volatility: 120.0,
    unit: 'USDT',
  },
};

export const D3LiveTradingChart: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<string>('XAUUSD');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showOrderBlocks, setShowOrderBlocks] = useState<boolean>(true);
  const [showFVG, setShowFVG] = useState<boolean>(true);
  const [showBands, setShowBands] = useState<boolean>(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Generate initial historical candles
  const [candles, setCandles] = useState<CandleData[]>(() => {
    return generateSeedCandles('XAUUSD', 40);
  });

  // Switch asset
  const handleAssetChange = (assetKey: string) => {
    setSelectedAsset(assetKey);
    setCandles(generateSeedCandles(assetKey, 40));
    setHoveredCandle(null);
  };

  // Seed candle generator
  function generateSeedCandles(assetKey: string, count: number): CandleData[] {
    const config = ASSETS[assetKey];
    const result: CandleData[] = [];
    let currentPrice = config.basePrice;
    const now = new Date();

    for (let i = count; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 1000); // 1-minute interval
      const change = (Math.random() - 0.49) * config.volatility * 2.2;
      const open = currentPrice;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * config.volatility * 1.2;
      const low = Math.min(open, close) - Math.random() * config.volatility * 1.2;
      const volume = Math.floor(150 + Math.random() * 850);

      let smcType: CandleData['smcType'];
      if (i === 28) smcType = 'OB_BULL';
      if (i === 18) smcType = 'FVG';
      if (i === 8) smcType = 'LIQ_SWEEP';

      result.push({
        time,
        open: Number(open.toFixed(config.pipDecimals)),
        high: Number(high.toFixed(config.pipDecimals)),
        low: Number(low.toFixed(config.pipDecimals)),
        close: Number(close.toFixed(config.pipDecimals)),
        volume,
        smcType,
      });

      currentPrice = close;
    }
    return result;
  }

  // Live simulation tick engine
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const config = ASSETS[selectedAsset];
        const lastCandle = prev[prev.length - 1];
        const delta = (Math.random() - 0.485) * (config.volatility * 0.45);
        const newClose = Number((lastCandle.close + delta).toFixed(config.pipDecimals));
        const newHigh = Math.max(lastCandle.high, newClose);
        const newLow = Math.min(lastCandle.low, newClose);
        const newVol = lastCandle.volume + Math.floor(Math.random() * 25);

        // Every ~15 updates (or random condition), create a new candle
        const shouldSpawnNewCandle = Math.random() > 0.88;

        if (shouldSpawnNewCandle && prev.length < 55) {
          const newTime = new Date(lastCandle.time.getTime() + 60 * 1000);
          const nextCandle: CandleData = {
            time: newTime,
            open: newClose,
            high: newClose,
            low: newClose,
            close: newClose,
            volume: Math.floor(100 + Math.random() * 400),
          };
          return [...prev.slice(1), nextCandle];
        }

        const updated = [...prev];
        updated[updated.length - 1] = {
          ...lastCandle,
          high: newHigh,
          low: newLow,
          close: newClose,
          volume: newVol,
        };
        return updated;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isPlaying, selectedAsset]);

  // Current price and summary metrics
  const currentAsset = ASSETS[selectedAsset];
  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange = lastCandle && firstCandle ? lastCandle.close - firstCandle.open : 0;
  const percentChange = firstCandle && firstCandle.open !== 0 ? (priceChange / firstCandle.open) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Real-time volatility index calculation (ATR-like variance)
  const currentVolatilityScore = useMemo(() => {
    if (candles.length < 5) return 'Moderada';
    const recentRanges = candles.slice(-10).map((c) => c.high - c.low);
    const avgRange = recentRanges.reduce((a, b) => a + b, 0) / recentRanges.length;
    const ratio = avgRange / currentAsset.volatility;
    if (ratio > 1.8) return 'Alta (Institucional)';
    if (ratio < 0.9) return 'Baja (Acumulación)';
    return 'Moderada (SMC Fluido)';
  }, [candles, currentAsset.volatility]);

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || candles.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const height = 440;
    const margin = { top: 25, right: 65, bottom: 55, left: 15 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const volumeHeight = 70;
    const priceHeight = chartHeight - volumeHeight - 20;

    svg.attr('width', containerWidth).attr('height', height).attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Price Scales
    const minPrice = d3.min(candles, (d) => d.low) ?? 0;
    const maxPrice = d3.max(candles, (d) => d.high) ?? 100;
    const pricePadding = (maxPrice - minPrice) * 0.08;

    const yScalePrice = d3
      .scaleLinear()
      .domain([minPrice - pricePadding, maxPrice + pricePadding])
      .range([priceHeight, 0]);

    // X Scale
    const xScale = d3
      .scaleBand<number>()
      .domain(candles.map((_, i) => i))
      .range([0, chartWidth])
      .padding(0.3);

    // Volume Scale
    const maxVolume = d3.max(candles, (d) => d.volume) ?? 1000;
    const yScaleVolume = d3
      .scaleLinear()
      .domain([0, maxVolume * 1.2])
      .range([chartHeight, chartHeight - volumeHeight]);

    // Background Grid lines
    const yAxisTicks = yScalePrice.ticks(6);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yAxisTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', (d) => yScalePrice(d))
      .attr('y2', (d) => yScalePrice(d))
      .attr('stroke', 'rgba(148, 163, 184, 0.08)')
      .attr('stroke-dasharray', '3,3');

    // Volatility Bands (Bollinger-style envelope overlay)
    if (showBands && candles.length >= 10) {
      const period = 10;
      const bandData: { i: number; upper: number; lower: number; ma: number }[] = [];

      for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1);
        const mean = d3.mean(slice, (d) => d.close) ?? slice[0].close;
        const stdDev = d3.deviation(slice, (d) => d.close) ?? 0;
        bandData.push({
          i,
          upper: mean + stdDev * 1.8,
          lower: mean - stdDev * 1.8,
          ma: mean,
        });
      }

      const areaGenerator = d3
        .area<{ i: number; upper: number; lower: number; ma: number }>()
        .x((d) => (xScale(d.i) ?? 0) + xScale.bandwidth() / 2)
        .y0((d) => yScalePrice(d.lower))
        .y1((d) => yScalePrice(d.upper))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(bandData)
        .attr('fill', 'rgba(59, 130, 246, 0.05)')
        .attr('stroke', 'none')
        .attr('d', areaGenerator);

      const lineGenerator = d3
        .line<{ i: number; upper: number; lower: number; ma: number }>()
        .x((d) => (xScale(d.i) ?? 0) + xScale.bandwidth() / 2)
        .y((d) => yScalePrice(d.ma))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(bandData)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(251, 191, 36, 0.4)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3')
        .attr('d', lineGenerator);
    }

    // Order Blocks (SMC Overlay)
    if (showOrderBlocks) {
      candles.forEach((c, idx) => {
        if (c.smcType === 'OB_BULL' || c.smcType === 'OB_BEAR') {
          const isBullOB = c.smcType === 'OB_BULL';
          const x = xScale(idx) ?? 0;
          const yTop = yScalePrice(c.high);
          const yBottom = yScalePrice(c.low);
          const blockWidth = Math.min(chartWidth - x, xScale.bandwidth() * 7);

          g.append('rect')
            .attr('x', x)
            .attr('y', yTop)
            .attr('width', blockWidth)
            .attr('height', Math.max(4, yBottom - yTop))
            .attr('fill', isBullOB ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')
            .attr('stroke', isBullOB ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)')
            .attr('stroke-dasharray', '3,2')
            .attr('rx', 3);

          g.append('text')
            .attr('x', x + 5)
            .attr('y', yTop + 14)
            .attr('font-size', '9px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .attr('fill', isBullOB ? 'var(--emerald)' : '#ef4444')
            .text(isBullOB ? 'OB DEMANDA (+)' : 'OB OFERTA (-)');
        }
      });
    }

    // Fair Value Gaps (FVG Overlay)
    if (showFVG) {
      candles.forEach((c, idx) => {
        if (c.smcType === 'FVG' && idx > 0 && idx < candles.length - 1) {
          const x = xScale(idx) ?? 0;
          const fvgTop = yScalePrice(c.high);
          const fvgBottom = yScalePrice(c.low);

          g.append('rect')
            .attr('x', x)
            .attr('y', fvgTop)
            .attr('width', xScale.bandwidth() * 5)
            .attr('height', Math.max(6, fvgBottom - fvgTop))
            .attr('fill', 'rgba(251, 191, 36, 0.12)')
            .attr('stroke', 'rgba(251, 191, 36, 0.45)')
            .attr('rx', 2);

          g.append('text')
            .attr('x', x + 4)
            .attr('y', fvgTop - 4)
            .attr('font-size', '9px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .attr('fill', 'var(--gold)')
            .text('FVG IMBALANCE');
        }
      });
    }

    // Volume Bars (at bottom)
    const volumeGroup = g.append('g').attr('class', 'volumes');
    volumeGroup
      .selectAll('rect')
      .data(candles)
      .enter()
      .append('rect')
      .attr('x', (_, i) => xScale(i) ?? 0)
      .attr('y', (d) => yScaleVolume(d.volume))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => chartHeight - yScaleVolume(d.volume))
      .attr('fill', (d) => (d.close >= d.open ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)'))
      .attr('rx', 1);

    // Candlesticks (Wicks and Bodies)
    const candlesGroup = g.append('g').attr('class', 'candlesticks');

    // Wicks
    candlesGroup
      .selectAll('line.wick')
      .data(candles)
      .enter()
      .append('line')
      .attr('class', 'wick')
      .attr('x1', (_, i) => (xScale(i) ?? 0) + xScale.bandwidth() / 2)
      .attr('x2', (_, i) => (xScale(i) ?? 0) + xScale.bandwidth() / 2)
      .attr('y1', (d) => yScalePrice(d.high))
      .attr('y2', (d) => yScalePrice(d.low))
      .attr('stroke', (d) => (d.close >= d.open ? 'var(--emerald)' : '#ef4444'))
      .attr('stroke-width', 1.2);

    // Bodies
    candlesGroup
      .selectAll('rect.candle-body')
      .data(candles)
      .enter()
      .append('rect')
      .attr('class', 'candle-body')
      .attr('x', (_, i) => xScale(i) ?? 0)
      .attr('y', (d) => yScalePrice(Math.max(d.open, d.close)))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => Math.max(2, Math.abs(yScalePrice(d.open) - yScalePrice(d.close))))
      .attr('fill', (d) => (d.close >= d.open ? 'var(--emerald)' : '#ef4444'))
      .attr('rx', 1.5)
      .attr('stroke', (d) => (d.close >= d.open ? '#059669' : '#dc2626'))
      .attr('stroke-width', 0.5);

    // Current Price Pulsing Line
    if (lastCandle) {
      const currentY = yScalePrice(lastCandle.close);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', currentY)
        .attr('y2', currentY)
        .attr('stroke', isPositive ? 'var(--emerald)' : '#ef4444')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '3,3');

      // Price Tag on Right Axis
      g.append('rect')
        .attr('x', chartWidth + 4)
        .attr('y', currentY - 11)
        .attr('width', 58)
        .attr('height', 22)
        .attr('fill', isPositive ? 'var(--emerald)' : '#ef4444')
        .attr('rx', 4);

      g.append('text')
        .attr('x', chartWidth + 8)
        .attr('y', currentY + 4)
        .attr('fill', '#07111f')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(lastCandle.close.toFixed(currentAsset.pipDecimals));
    }

    // Right Y-Axis (Price labels)
    const yAxisRight = d3
      .axisRight(yScalePrice)
      .ticks(6)
      .tickFormat((d) => Number(d).toFixed(currentAsset.pipDecimals));

    const yAxisGroup = g.append('g').attr('transform', `translate(${chartWidth}, 0)`).call(yAxisRight);

    yAxisGroup.select('.domain').attr('stroke', 'rgba(148, 163, 184, 0.2)');
    yAxisGroup.selectAll('line').attr('stroke', 'rgba(148, 163, 184, 0.15)');
    yAxisGroup
      .selectAll('text')
      .attr('fill', 'var(--muted)')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Bottom X-Axis (Time labels)
    const step = Math.max(1, Math.floor(candles.length / 6));
    const tickIndices = candles.map((_, i) => i).filter((i) => i % step === 0);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(tickIndices)
          .tickFormat((i) => {
            const c = candles[Number(i)];
            if (!c) return '';
            const hours = c.time.getHours().toString().padStart(2, '0');
            const mins = c.time.getMinutes().toString().padStart(2, '0');
            return `${hours}:${mins}`;
          })
      );

    xAxisGroup.select('.domain').attr('stroke', 'rgba(148, 163, 184, 0.2)');
    xAxisGroup.selectAll('line').attr('stroke', 'rgba(148, 163, 184, 0.15)');
    xAxisGroup
      .selectAll('text')
      .attr('fill', 'var(--muted)')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Interactive Overlay for Mouse Tracking
    const overlay = g
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    // Crosshair Lines
    const crosshairX = g
      .append('line')
      .attr('stroke', 'rgba(251, 191, 36, 0.55)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .style('display', 'none');

    const crosshairY = g
      .append('line')
      .attr('stroke', 'rgba(251, 191, 36, 0.55)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .style('display', 'none');

    overlay
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event);
        crosshairX.style('display', null).attr('x1', mx).attr('x2', mx).attr('y1', 0).attr('y2', chartHeight);
        crosshairY.style('display', null).attr('x1', 0).attr('x2', chartWidth).attr('y1', my).attr('y2', my);

        // Find closest candle index
        const bandwidth = xScale.step();
        const hoveredIndex = Math.min(candles.length - 1, Math.max(0, Math.floor(mx / bandwidth)));
        const candle = candles[hoveredIndex];
        if (candle) {
          setHoveredCandle(candle);
          setMousePos({ x: mx + margin.left, y: my + margin.top });
        }
      })
      .on('mouseleave', () => {
        crosshairX.style('display', 'none');
        crosshairY.style('display', 'none');
        setHoveredCandle(null);
        setMousePos(null);
      });
  }, [candles, selectedAsset, showOrderBlocks, showFVG, showBands, isPositive, currentAsset]);

  const activeCandle = hoveredCandle || lastCandle;

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, var(--surface-3), var(--surface))',
        border: '1px solid var(--line-strong)',
        borderRadius: 'var(--radius)',
        padding: 'clamp(1.5rem, 3.5vw, 2.2rem)',
        marginBottom: '4.5rem',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Chart Top Header & Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--line)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              padding: '0.35rem 0.8rem',
              borderRadius: '999px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isPlaying ? 'var(--emerald)' : '#ef4444',
                boxShadow: isPlaying ? '0 0 8px var(--emerald)' : 'none',
              }}
            ></span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#93c5fd', letterSpacing: '0.04em' }}>
              D3 LIVE TICKER (1M)
            </span>
          </div>

          {/* Asset Selector */}
          <div style={{ display: 'inline-flex', gap: '0.35rem', background: 'var(--surface-2)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
            {Object.keys(ASSETS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleAssetChange(key)}
                style={{
                  background: selectedAsset === key ? 'var(--accent)' : 'transparent',
                  color: selectedAsset === key ? '#fff' : 'var(--muted)',
                  border: 0,
                  borderRadius: '6px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s var(--ease)',
                }}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Volatility Status Badge */}
          <span className="badge" style={{ fontSize: '0.74rem', background: 'rgba(251, 191, 36, 0.12)', color: 'var(--gold)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
            ⚡ Volatilidad: {currentVolatilityScore}
          </span>
        </div>

        {/* Live Playback & Indicator Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
            onClick={() => setIsPlaying((p) => !p)}
            title={isPlaying ? 'Pausar simulación de ticks' : 'Reanudar simulación en vivo'}
          >
            {isPlaying ? '⏸ Pausar Ticks' : '▶ Reanudar Ticks'}
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              borderColor: showOrderBlocks ? 'var(--emerald)' : 'var(--line)',
              color: showOrderBlocks ? 'var(--emerald)' : 'var(--muted)',
            }}
            onClick={() => setShowOrderBlocks((p) => !p)}
          >
            {showOrderBlocks ? '✓ Order Blocks' : 'Order Blocks'}
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              borderColor: showFVG ? 'var(--gold)' : 'var(--line)',
              color: showFVG ? 'var(--gold)' : 'var(--muted)',
            }}
            onClick={() => setShowFVG((p) => !p)}
          >
            {showFVG ? '✓ FVG Gaps' : 'FVG Gaps'}
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              borderColor: showBands ? 'var(--accent)' : 'var(--line)',
              color: showBands ? '#93c5fd' : 'var(--muted)',
            }}
            onClick={() => setShowBands((p) => !p)}
          >
            {showBands ? '✓ Bandas Volatilidad' : 'Bandas Volatilidad'}
          </button>
        </div>
      </div>

      {/* Dynamic Price Bar & OHLC HUD */}
      {activeCandle && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: '1.25rem',
            marginBottom: '0.85rem',
            fontFamily: 'monospace',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-head)', color: isPositive ? 'var(--emerald)' : '#ef4444' }}>
              {activeCandle.close.toFixed(currentAsset.pipDecimals)}
            </span>
            <span style={{ color: 'var(--muted-2)', fontSize: '0.85rem' }}>{currentAsset.unit}</span>
            <span style={{ color: isPositive ? 'var(--emerald)' : '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
              {isPositive ? '+' : ''}{priceChange.toFixed(currentAsset.pipDecimals)} ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
            <span>
              O: <strong style={{ color: '#fff' }}>{activeCandle.open.toFixed(currentAsset.pipDecimals)}</strong>
            </span>
            <span>
              H: <strong style={{ color: 'var(--emerald)' }}>{activeCandle.high.toFixed(currentAsset.pipDecimals)}</strong>
            </span>
            <span>
              L: <strong style={{ color: '#ef4444' }}>{activeCandle.low.toFixed(currentAsset.pipDecimals)}</strong>
            </span>
            <span>
              C: <strong style={{ color: '#fff' }}>{activeCandle.close.toFixed(currentAsset.pipDecimals)}</strong>
            </span>
            <span>
              Vol: <strong style={{ color: 'var(--gold)' }}>{activeCandle.volume.toLocaleString()}</strong>
            </span>
            {activeCandle.smcType && (
              <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>
                ⭐ {activeCandle.smcType === 'OB_BULL' ? 'Order Block Alcista' : activeCandle.smcType === 'FVG' ? 'Fair Value Gap' : 'Liquidity Sweep'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* D3 Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
        <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }}></svg>

        {/* Hovered Floating Tooltip */}
        {hoveredCandle && mousePos && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(mousePos.x + 15, (containerRef.current?.clientWidth || 800) - 190),
              top: Math.max(10, mousePos.y - 75),
              background: 'rgba(11, 18, 32, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--line-strong)',
              borderRadius: '8px',
              padding: '0.6rem 0.85rem',
              pointerEvents: 'none',
              zIndex: 10,
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              color: 'var(--text)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: '0.2rem' }}>
              {hoveredCandle.time.toLocaleTimeString()} UTC
            </div>
            <div>Apertura: {hoveredCandle.open}</div>
            <div>Máximo: <span style={{ color: 'var(--emerald)' }}>{hoveredCandle.high}</span></div>
            <div>Mínimo: <span style={{ color: '#ef4444' }}>{hoveredCandle.low}</span></div>
            <div>Cierre: {hoveredCandle.close}</div>
            <div>Volumen: {hoveredCandle.volume}</div>
          </div>
        )}
      </div>

      {/* Legend & Guide footer */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--line)',
          fontSize: '0.82rem',
          color: 'var(--muted)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.4)', border: '1px solid var(--emerald)', borderRadius: '2px' }}></span>
            <span>Vela Alcista / OB Demanda</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.4)', border: '1px solid #ef4444', borderRadius: '2px' }}></span>
            <span>Vela Bajista / OB Oferta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', background: 'rgba(251, 191, 36, 0.25)', border: '1px dashed var(--gold)', borderRadius: '2px' }}></span>
            <span>FVG (Fair Value Gap)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '18px', height: '2px', background: 'var(--accent)', borderTop: '2px dashed var(--gold)' }}></span>
            <span>Bandas Dinámicas ATR/MA</span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted-2)' }}>
          *Simulación generada por algoritmo D3 con flujo de órdenes institucional en tiempo real.
        </p>
      </div>
    </div>
  );
};
