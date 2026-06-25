import React, { useEffect, useMemo, useRef, useState } from "react";
import "./BtcRunningChart.css";

const DEFAULT_ROUND_MS = 5 * 60 * 1000;

const formatMoney = (value) => {
  if (value === null || value === undefined) return "0.00";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getRoundStart = (time, duration) => {
  return Math.floor(time / duration) * duration;
};

const smoothPath = (points) => {
  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];

    const midX = (prev.x + current.x) / 2;

    d += ` C ${midX} ${prev.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }

  return d;
};

const BtcRunningChart = ({
  title = "BTC Up or Down 5m",
  isResolved = false,
  winningOutcome = null,
  marketCreatedAt = null,
  marketEndTime = null,
  basePrice = null,
  onGoToLive = null,
}) => {
  const ROUND_MS = useMemo(() => {
    if (marketCreatedAt && marketEndTime) {
      const diff = marketEndTime - marketCreatedAt;
      if (diff > 0) return diff;
    }
    return DEFAULT_ROUND_MS;
  }, [marketCreatedAt, marketEndTime]);

  const binanceInterval = useMemo(() => {
    const durationMins = ROUND_MS / 60000;
    if (durationMins <= 6) return "1s";
    if (durationMins <= 450) return "1m";
    return "5m";
  }, [ROUND_MS]);

  const initialRound = marketCreatedAt || getRoundStart(Date.now(), ROUND_MS);

  const roundStartRef = useRef(initialRound);
  const priceToBeatRef = useRef(basePrice);

  const [now, setNow] = useState(Date.now());
  const [roundStart, setRoundStart] = useState(initialRound);
  const [priceToBeat, setPriceToBeat] = useState(basePrice);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [points, setPoints] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(isResolved ? "Resolved" : "Connecting");

  // Refs to buffer live ticks and prevent high-frequency re-renders (blinking)
  const latestPriceRef = useRef(null);
  const latestTimeRef = useRef(null);

  // Keep internal states synced with props when switching rounds
  useEffect(() => {
    const calculatedStart = marketCreatedAt || getRoundStart(Date.now(), ROUND_MS);
    roundStartRef.current = calculatedStart;
    priceToBeatRef.current = basePrice;
    setRoundStart(calculatedStart);
    setPriceToBeat(basePrice);
    setPoints([]);
    setCurrentPrice(null);
    setConnectionStatus(isResolved ? "Resolved" : "Connecting");
    latestPriceRef.current = null;
    latestTimeRef.current = null;
  }, [isResolved, marketCreatedAt, marketEndTime, basePrice, ROUND_MS]);

  // Tick clock once every second to run the countdown timer
  useEffect(() => {
    if (isResolved) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [isResolved]);

  // Fetch historical kline ticks (supports live round starting segments & resolved static bounds)
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const startTime = roundStartRef.current;
        let url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${binanceInterval}&startTime=${startTime}&limit=450`;
        
        if (isResolved && marketEndTime) {
          url += `&endTime=${marketEndTime}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data)) {
          const historicalPoints = data.map((item) => ({
            time: Number(item[0]),
            price: Number(item[4]), // Close price
          }));

          if (historicalPoints.length > 0) {
            const startPrice = basePrice || historicalPoints[0].price;
            priceToBeatRef.current = startPrice;
            setPriceToBeat(startPrice);
            
            const latestPrice = historicalPoints[historicalPoints.length - 1].price;
            setCurrentPrice(latestPrice);

            setPoints(historicalPoints);
          }
        }
      } catch (err) {
        console.error("Error fetching historical klines from Binance:", err);
      }
    };

    fetchHistory();
  }, [roundStart, isResolved, marketEndTime, basePrice, binanceInterval]);

  // WebSocket connection for real-time live trading stream (only for open rounds)
  useEffect(() => {
    if (isResolved) return;

    let socket = null;

    const connectWebSocket = () => {
      socket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");

      socket.onopen = () => {
        setConnectionStatus("Live");
      };

      socket.onerror = () => {
        setConnectionStatus("Error");
      };

      socket.onclose = () => {
        setConnectionStatus("Closed");
        setTimeout(connectWebSocket, 3000);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const livePrice = Number(data.p);
        const tradeTime = data.T || Date.now();

        // Only buffer if the trade falls within the current round boundaries
        if (tradeTime < roundStartRef.current || (marketEndTime && tradeTime > marketEndTime)) {
          return;
        }

        if (!priceToBeatRef.current) {
          priceToBeatRef.current = livePrice;
          setPriceToBeat(livePrice);
        }

        // Buffer the values to be processed by the throttle loop
        latestPriceRef.current = livePrice;
        latestTimeRef.current = tradeTime;
      };
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [isResolved]);

  // Throttle state updates to once per 1 second to avoid browser page blinking/lag
  useEffect(() => {
    if (isResolved) return;

    const throttleTimer = setInterval(() => {
      if (latestPriceRef.current !== null) {
        const livePrice = latestPriceRef.current;
        const tradeTime = latestTimeRef.current || Date.now();

        setCurrentPrice(livePrice);

        setPoints((prev) => {
          const filtered = prev.filter((item) => item.time !== tradeTime);
          const updated = [...filtered, { time: tradeTime, price: livePrice }];

          return updated
            .filter((item) => item.time >= roundStartRef.current)
            .slice(-450);
        });
      }
    }, 1000);

    return () => clearInterval(throttleTimer);
  }, [isResolved]);

  const roundEnd = roundStart + ROUND_MS;
  const timeLeft = isResolved ? 0 : Math.max(0, roundEnd - now);

  const days = Math.floor(timeLeft / (24 * 60 * 60000));
  const hours = Math.floor((timeLeft % (24 * 60 * 60000)) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const priceDifference =
    currentPrice && priceToBeat ? currentPrice - priceToBeat : 0;

  const isUp = priceDifference >= 0;

  const roundLabel = useMemo(() => {
    const start = new Date(roundStart);
    const end = new Date(roundStart + ROUND_MS);

    const day = start.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });

    const formatHourMinute = (date) => {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes}${ampm}`;
    };

    const startStr = formatHourMinute(start);
    const endStr = formatHourMinute(end);

    return `${day}, ${startStr.replace(/(AM|PM)/, "")}-${endStr} ET`;
  }, [roundStart, ROUND_MS]);

  const priceParts = useMemo(() => {
    if (!currentPrice) return { integer: "--", decimal: "--" };
    const formatted = formatMoney(currentPrice);
    const dotIndex = formatted.indexOf(".");
    if (dotIndex === -1) return { integer: formatted, decimal: "00" };
    return {
      integer: formatted.substring(0, dotIndex),
      decimal: formatted.substring(dotIndex + 1),
    };
  }, [currentPrice]);

  const chartData = useMemo(() => {
    const width = 920;
    const height = 260;

    const left = 60;
    const right = 80;
    const top = 30;
    const bottom = 45;

    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const prices = points.map((item) => item.price);

    if (priceToBeat) prices.push(priceToBeat);
    if (currentPrice) prices.push(currentPrice);

    const centerPrice = priceToBeat || (prices.length ? prices[0] : 0);
    const maxDiff = prices.reduce((acc, p) => Math.max(acc, Math.abs(p - centerPrice)), 0);
    const padding = Math.max(maxDiff * 1.25, 5); // Add generous padding to avoid clipping

    const min = centerPrice - padding;
    const max = centerPrice + padding;

    const mappedPoints = points.map((item) => {
      const x =
        left + ((item.time - roundStart) / ROUND_MS) * chartWidth;

      const y =
        top + ((max - item.price) / (max - min)) * chartHeight;

      return { x, y };
    });

    const targetY =
      priceToBeat !== null
        ? top + ((max - priceToBeat) / (max - min)) * chartHeight
        : null;

    const currentY =
      currentPrice !== null
        ? top + ((max - currentPrice) / (max - min)) * chartHeight
        : null;

    // Use 5 grid lines so the middle line aligns exactly with the center price (target line)
    const gridPrices = [
      max,
      max - (max - min) * 0.25,
      centerPrice,
      min + (max - min) * 0.25,
      min,
    ];

    const timeTicks = [];
    for (let i = 0; i <= 6; i++) {
      const tickTime = roundStart + (ROUND_MS / 6) * i;
      const x = left + (i / 6) * chartWidth;
      const timeStr = new Date(tickTime).toLocaleTimeString("en-US", {
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
      timeTicks.push({ x, label: timeStr });
    }

    return {
      width,
      height,
      left,
      right,
      top,
      bottom,
      chartWidth,
      chartHeight,
      mappedPoints,
      targetY,
      currentY,
      gridPrices,
      timeTicks,
      min,
      max,
    };
  }, [points, priceToBeat, currentPrice, roundStart, ROUND_MS]);

  return (
    <div className="btc-market-card">
      <div className="btc-top">
        <div className="btc-left">
          <div className="btc-logo">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
              <path d="M23.638 14.904c-1.602 6.43-8.155 10.348-14.628 8.75C2.538 22.05-1.384 15.525.218 9.103 1.82 2.67 8.374-1.248 14.846.35c6.48 1.602 10.395 8.127 8.792 14.554zm-6.28-4.225c.294-1.96-1.197-3.016-3.235-3.72l.66-2.65-1.61-.4-.644 2.587c-.423-.105-.857-.205-1.285-.3l.65-2.613-1.61-.4-.66 2.653c-.35-.08-.692-.158-1.025-.24l.002-.007-2.22-.555-.428 1.72s1.195.273 1.17.29c.652.163.77.595.75.94l-.752 3.016c.045.012.104.03.17.058l-.173-.043-.17 4.223c-.09.225-.32.563-.827.437.018.026-1.17-.292-1.17-.292l-.797 1.84 2.095.522c.39.1.77.2 1.144.296l-.67 2.693 1.61.4.66-2.653c.44.12.868.23 1.284.335l-.657 2.637 1.61.4.673-2.695c2.75.52 4.818.31 5.688-2.176.7-2.002-.034-3.158-1.486-3.914 1.057-.244 1.853-.94 2.066-2.383zm-3.7 5.21c-.5 2.008-3.882.923-4.98.65l.89-3.565c1.1.272 4.6 1.042 4.09 3.915zm.5-5.242c-.455 1.827-3.273.9-4.186.674l.808-3.24c.913.227 3.842.65 3.377 2.566z" />
            </svg>
          </div>

          <div>
            <h2>{title}</h2>
            <p>{roundLabel}</p>
          </div>
        </div>

        <div className="btc-icons">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
          </svg>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" />
          </svg>
        </div>
      </div>

      <div className="btc-info-row">
        <div className="btc-price-box">
          <span>Price To Beat</span>
          <strong className="beat-value">${formatMoney(priceToBeat)}</strong>
        </div>

        <div className="btc-divider" />

        <div className="btc-price-box current">
          <span>Current Price</span>
          <div className="current-price-display">
            <strong className="orange-price">
              ${priceParts.integer}.
              <span className="superscript-cents">{priceParts.decimal}</span>
            </strong>

            {currentPrice && priceToBeat && (
              <span className={`diff-badge ${isUp ? "green" : "red"}`}>
                {isUp ? "▲" : "▼"} ${Math.abs(priceDifference).toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {isResolved ? (
          <div className="flex items-center gap-3.5 ml-auto">
            <div className="btc-resolved-box">
              <span>Outcome</span>
              <strong className={`outcome-badge ${winningOutcome === "Up" ? "green" : "red"}`}>
                {winningOutcome ? winningOutcome.toUpperCase() : "RESOLVED"}
              </strong>
            </div>
            {onGoToLive && (
              <button
                type="button"
                onClick={onGoToLive}
                className="flex items-center gap-1.5 bg-[#0072F5] hover:bg-[#005ecf] text-white font-extrabold text-[9px] uppercase tracking-wider px-3.5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                Go To Live
              </button>
            )}
          </div>
        ) : (
          <div className="btc-countdown">
            {days > 0 ? (
              <>
                <div>
                  <strong className="red-digits">{String(days).padStart(2, "0")}</strong>
                  <span>DAYS</span>
                </div>
                <div>
                  <strong className="red-digits">{String(hours).padStart(2, "0")}</strong>
                  <span>HRS</span>
                </div>
                <div>
                  <strong className="red-digits">{String(minutes).padStart(2, "0")}</strong>
                  <span>MINS</span>
                </div>
              </>
            ) : hours > 0 ? (
              <>
                <div>
                  <strong className="red-digits">{String(hours).padStart(2, "0")}</strong>
                  <span>HRS</span>
                </div>
                <div>
                  <strong className="red-digits">{String(minutes).padStart(2, "0")}</strong>
                  <span>MINS</span>
                </div>
                <div>
                  <strong className="red-digits">{String(seconds).padStart(2, "0")}</strong>
                  <span>SECS</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <strong className="red-digits">{String(minutes).padStart(2, "0")}</strong>
                  <span>MINS</span>
                </div>
                <div>
                  <strong className="red-digits">{String(seconds).padStart(2, "0")}</strong>
                  <span>SECS</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="btc-chart-area">
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="btc-svg"
          preserveAspectRatio="none"
        >
          {/* Horizontal Grid Lines */}
          {chartData.gridPrices.map((price, index) => {
            const y =
              chartData.top +
              ((chartData.max - price) /
                (chartData.max - chartData.min)) *
                chartData.chartHeight;

            return (
              <g key={index}>
                <line
                  x1={chartData.left}
                  x2={chartData.width - chartData.right}
                  y1={y}
                  y2={y}
                  className="grid-line"
                />

                <text
                  x={chartData.width - chartData.right + 8}
                  y={y + 4}
                  className="price-label"
                >
                  ${price.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Dash Target Line */}
          {priceToBeat && chartData.targetY && (
            <>
              <line
                x1={chartData.left}
                x2={chartData.width - chartData.right}
                y1={chartData.targetY}
                y2={chartData.targetY}
                className="target-line"
              />

              <text
                x={chartData.width - chartData.right + 8}
                y={chartData.targetY + 4}
                className="target-price"
              >
                ${priceToBeat.toFixed(0)}
              </text>
            </>
          )}

          {/* Running Curve Path */}
          <path
            d={smoothPath(chartData.mappedPoints)}
            className="btc-running-line"
            fill="none"
          />

          {/* End Dot */}
          {chartData.mappedPoints.length > 0 && chartData.currentY && (
            <circle
              cx={
                chartData.mappedPoints[chartData.mappedPoints.length - 1].x
              }
              cy={chartData.currentY}
              r="6"
              className="current-dot"
            />
          )}

          {/* Position indicator tags on left */}
          <text x="15" y="115" className="green-level">
            + $1
          </text>
          <text x="15" y="140" className="green-level">
            + $14
          </text>
          <text x="15" y="165" className="green-level">
            + $12
          </text>
          <text x="15" y="190" className="green-level">
            + $7
          </text>
          <text x="15" y="215" className="green-level">
            + $4
          </text>

          {/* X Axis Time Labels */}
          {chartData.timeTicks.map((tick, i) => (
            <text key={i} x={tick.x} y={248} className="time-label" textAnchor="middle">
              {tick.label}
            </text>
          ))}

          {/* Target dropdown tag pill */}
          <g transform={`translate(${chartData.width - 82}, ${chartData.height - 54})`}>
            <rect
              width="70"
              height="20"
              rx="10"
              className="target-pill"
            />
            <text
              x="30"
              y="13"
              textAnchor="middle"
              className="target-pill-text"
            >
              Target
            </text>
            <path d="M52 8L55 12L58 8" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
          </g>
        </svg>
      </div>

      <div className="btc-footer">
        <span className={connectionStatus === "Live" ? "live-dot" : "off-dot"} />
        {isResolved ? "Resolved" : connectionStatus} BTC/USDT market data
      </div>
    </div>
  );
};

export default BtcRunningChart;
