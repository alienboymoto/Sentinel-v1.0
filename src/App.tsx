import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CoinCard from './components/CoinCard';
import { CoinState } from './types';

type LogEntry = {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'alert';
};

const INITIAL_COINS: CoinState[] = [

  {
    symbol: 'BTCUSDT',
    displayName: 'Bitcoin',
    smas: [{ period: 'NA', tf: 'NA' }, { period: 'NA', tf: 'NA' }, { period: 'NA', tf: 'NA' }],
    alerts: [{ price: '', triggered: false }, { price: '', triggered: false }, { price: '', triggered: false }],
    lastPrice: 0,
    currentPrice: 0
  },
  {
    symbol: 'ETHUSDT',
    displayName: 'Ethereum',
    smas: [{ period: 'NA', tf: 'NA' }, { period: 'NA', tf: 'NA' }, { period: 'NA', tf: 'NA' }],
    alerts: [{ price: '', triggered: false }, { price: '', triggered: false }, { price: '', triggered: false }],
    lastPrice: 0,
    currentPrice: 0
  },
  {
    symbol: 'SOLUSDT',
    displayName: 'Solana',
    smas: [{ period: 'NA', tf: 'NA' }, { period: 'NA', tf: 'NA' }, { period: 'NA', tf: 'NA' }],
    alerts: [{ price: '', triggered: false }, { price: '', triggered: false }, { price: '', triggered: false }],
    lastPrice: 0,
    currentPrice: 0
  }
];

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [coins, setCoins] = useState<CoinState[]>(INITIAL_COINS);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: 'info' | 'alert') => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message,
        type
      };
      return [newLog, ...prev].slice(0, 100);
    });
  };

  // Keep a ref to the latest state so the timer effect has access to it
  const coinsRef = useRef(coins);
  useEffect(() => {
    coinsRef.current = coins;
  }, [coins]);

  // Initial price fetch
  useEffect(() => {
    const fetchInitial = async () => {
      const updated = [...INITIAL_COINS];
      for (let coin of updated) {
        try {
          const res = await fetch(`/api/price/${coin.symbol}`);
          const data = await res.json();
          coin.currentPrice = parseFloat(data.price);
          coin.lastPrice = parseFloat(data.price);
        } catch (e) {
          console.error('Initial fetch error for', coin.symbol);
        }
      }
      setCoins(updated);
    };
    fetchInitial();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      performChecks();
      setTimeLeft(300); // Reset for next cycle
    } else if (!isActive) {
      setTimeLeft(300); // Reset timer if paused
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  const performChecks = async () => {
    const currentCoins = [...coinsRef.current];
    const updatedCoins = JSON.parse(JSON.stringify(currentCoins)) as CoinState[];

    for (let i = 0; i < updatedCoins.length; i++) {
      const coin = updatedCoins[i];
      const oldPrice = currentCoins[i].lastPrice || coin.currentPrice;

      // 1. Fetch current price
      try {
        const res = await fetch(`/api/price/${coin.symbol}`);
        const data = await res.json();
        coin.currentPrice = parseFloat(data.price);
      } catch (e) {
        console.error('Failed to fetch price for', coin.symbol);
        continue; // Skip this coin if we can't get price
      }

      const alertMessages: string[] = [];

      // 2. Check Price Alerts
      coin.alerts.forEach((alert, index) => {
        if (!alert.triggered && alert.price !== '') {
          const target = parseFloat(alert.price);
          if (!isNaN(target)) {
            // Check if price crossed the alert target
            const crossedUp = oldPrice <= target && coin.currentPrice >= target;
            const crossedDown = oldPrice >= target && coin.currentPrice <= target;
            const exact = coin.currentPrice === target;

            if (crossedUp || crossedDown || exact) {
              alert.triggered = true;
              const msg = `🎯 <b>Price Alert A${index + 1} Hit!</b>\nCoin: ${coin.displayName}\nTarget: $${target.toLocaleString()}\nCurrent Price: $${coin.currentPrice.toLocaleString()}`;
              alertMessages.push(msg);
              addLog(`Price Alert A${index + 1} Hit on ${coin.displayName} at $${coin.currentPrice}`, 'alert');
            }
          }
        }
      });

      // 3. Check SMAs
      let smaConfiguredCount = 0;
      let smaTouchCount = 0;
      const smaDetails: string[] = [];

      for (const sma of coin.smas) {
        if (sma.period !== 'NA' && sma.tf !== 'NA') {
          smaConfiguredCount++;
          try {
            // Format timeframe for Binance (1D -> 1d)
            const mappedTf = sma.tf.replace('D', 'd');
            const res = await fetch(`/api/sma/${coin.symbol}/${mappedTf}/${sma.period}`);
            const data = await res.json();
            const smaVal = parseFloat(data.sma);
            
            // Check if touched (within 0.3% threshold) or crossed
            const proximity = Math.abs(coin.currentPrice - smaVal) / smaVal;
            const crossedUp = oldPrice <= smaVal && coin.currentPrice >= smaVal;
            const crossedDown = oldPrice >= smaVal && coin.currentPrice <= smaVal;

            if (proximity <= 0.003 || crossedUp || crossedDown) {
              smaTouchCount++;
            }
            smaDetails.push(`${sma.tf}:${sma.period} ($${smaVal.toFixed(2)})`);
          } catch (e) {
            console.error('Failed SMA fetch for', coin.symbol);
          }
        }
      }

      // If at least one SMA is configured, and ALL configured SMAs are touched, send convergence alert.
      if (smaConfiguredCount > 0 && smaConfiguredCount === smaTouchCount) {
        const msg = `📈 <b>SMA Convergence Alert!</b>\nCoin: ${coin.displayName}\nCurrent Price: $${coin.currentPrice.toLocaleString()}\nDetails: ${smaDetails.join(', ')}`;
        alertMessages.push(msg);
        addLog(`SMA Convergence on ${coin.displayName} at $${coin.currentPrice}`, 'alert');
      }

      // 4. Dispatch Telegram Alerts
      for (const msg of alertMessages) {
        try {
          await fetch('/api/alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: msg })
          });
        } catch (e) {
          console.error('Failed to dispatch Telegram alert');
        }
      }

      // 5. Update last checked price
      coin.lastPrice = coin.currentPrice;
    }

    setCoins(updatedCoins);
  };

  const updateCoin = (index: number, newCoin: CoinState) => {
    const newCoins = [...coins];
    newCoins[index] = newCoin;
    setCoins(newCoins);
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-slate-950 text-slate-200 font-sans flex flex-col lg:overflow-hidden select-none">
      <Header isActive={isActive} setIsActive={setIsActive} timeLeft={timeLeft} />
      <main className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:overflow-hidden">
        {/* Left Side: Coins (Vertical Stack) */}
        <div className="flex-1 flex flex-col gap-4 lg:gap-6 lg:overflow-y-auto lg:pr-2 pb-2 lg:pb-6">
          {coins.map((coin, idx) => (
            <CoinCard key={coin.symbol} coin={coin} index={idx} updateCoin={updateCoin} />
          ))}
        </div>
        
        {/* Right Side: Realtime Log */}
        <aside className="h-64 lg:h-auto w-full lg:w-96 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[32px] flex flex-col shadow-2xl overflow-hidden shrink-0">
          <div className="p-4 lg:p-5 border-b border-slate-800 bg-slate-900/80">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Realtime Log
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-xs italic text-center mt-10">No alerts yet. Waiting for triggers...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex flex-col gap-1 bg-slate-800/40 rounded-xl p-3 border border-slate-800/60 text-xs">
                  <span className="text-slate-500 font-mono text-[10px]">{log.time}</span>
                  <span className={log.type === 'alert' ? 'text-yellow-400 font-medium' : 'text-slate-300'}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      <footer className="p-4 lg:p-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row gap-4 lg:gap-6 mt-auto shrink-0">
        <div className="flex-1 bg-slate-950/50 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-10 h-10 bg-sky-600/20 rounded-lg items-center justify-center">
              <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.24.37-.49 1.02-.74 4-1.74 6.67-2.88 8.01-3.43 3.81-1.58 4.6-1.85 5.11-1.86.11 0 .37.03.54.17.14.12.18.28.2.45-.01.07.01.2 0 .22z"></path></svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Telegram Integration</p>
              <p className="text-xs sm:text-sm text-slate-300 font-mono">Bot: 8849597... | ID: 621775...</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer">Test</button>
            <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer">Edit</button>
          </div>
        </div>

        <div className="hidden lg:flex w-72 bg-slate-950/50 rounded-2xl p-4 border border-slate-800 flex-col justify-center">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">API Latency</span>
            <span className="text-emerald-400 text-[10px] font-bold">ONLINE</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-sky-500"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Connected to Binance Stream v3</p>
        </div>
      </footer>
    </div>
  );
}
