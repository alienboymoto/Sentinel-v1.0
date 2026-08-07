import { CoinState } from '../types';

const SMA_OPTIONS = ['NA', '9', '15', '20', '50', '100', '200'];
const TF_OPTIONS = ['NA', '5m', '15m', '1h', '4h', '1D', '3D', '1w'];

export default function CoinCard({
  coin,
  index,
  updateCoin
}: {
  coin: CoinState;
  index: number;
  updateCoin: (index: number, newCoin: CoinState) => void;
}) {
  const updateSma = (smaIndex: number, field: 'period' | 'tf', value: string) => {
    const updated = { ...coin };
    updated.smas[smaIndex] = { ...updated.smas[smaIndex], [field]: value };
    updateCoin(index, updated);
  };

  const updateAlert = (alertIndex: number, value: string) => {
    const updated = { ...coin };
    // Only reset triggered status if the price actually changes
    if (updated.alerts[alertIndex].price !== value) {
      updated.alerts[alertIndex] = { price: value, triggered: false };
      updateCoin(index, updated);
    }
  };

  // Determine styles per coin
  const styles = {
    iconBg: index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-indigo-500' : 'bg-teal-400',
    iconText: index === 0 ? 'text-white' : index === 1 ? 'text-white' : 'text-black font-black',
    iconSymbol: index === 0 ? '₿' : index === 1 ? 'Ξ' : 'S',
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[32px] p-4 md:p-6 flex flex-col xl:flex-row gap-4 md:gap-6 shadow-2xl relative overflow-hidden shrink-0">
      <div className="flex flex-row xl:flex-col justify-between items-start xl:w-48 shrink-0">
        <div>
          <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2 mb-1">
            <span className={`w-6 h-6 md:w-8 md:h-8 ${styles.iconBg} rounded-full flex items-center justify-center text-[10px] md:text-xs ${styles.iconText}`}>
              {styles.iconSymbol}
            </span> 
            {coin.symbol.replace('USDT', '')}/USDT
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">Binance Spot</p>
        </div>
        <div className="text-right xl:text-left mt-0 xl:mt-4">
          <p className="text-base md:text-xl font-mono font-bold text-white">
            {coin.currentPrice > 0 ? coin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '---'}
          </p>
          <p className="text-emerald-400 text-[10px] md:text-xs">+0.00%</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* SMAs */}
        <div className="flex flex-col gap-2">
          {coin.smas.map((sma, i) => (
            <div key={`sma-${i}`} className="flex items-center gap-2 bg-slate-800/30 p-2 rounded-xl border border-slate-700/50">
              <label className="text-[10px] uppercase text-slate-500 font-bold w-10 shrink-0">SMA {i + 1}</label>
              <select
                value={sma.period}
                onChange={(e) => updateSma(i, 'period', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-sky-500"
              >
                {SMA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Timeframes */}
        <div className="flex flex-col gap-2">
          {coin.smas.map((sma, i) => (
            <div key={`tf-${i}`} className="flex items-center gap-2 bg-slate-800/30 p-2 rounded-xl border border-slate-700/50">
              <label className="text-[10px] uppercase text-slate-500 font-bold w-8 shrink-0">TF {i + 1}</label>
              <select
                value={sma.tf}
                onChange={(e) => updateSma(i, 'tf', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-sky-500"
              >
                {TF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Alerts */}
        <div className="flex flex-col gap-2">
          {coin.alerts.map((alert, i) => {
            const isHit = alert.triggered;
            return (
              <div key={`alert-${i}`} className={`flex items-center gap-2 p-2 rounded-xl border ${isHit ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                <span className={`text-[10px] w-12 shrink-0 ${isHit ? 'text-emerald-300 font-bold' : 'text-slate-400 font-bold uppercase'}`}>
                  A{i + 1} {isHit ? '(HIT)' : '($)'}
                </span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={alert.price}
                  onChange={(e) => updateAlert(i, e.target.value)}
                  className={`flex-1 bg-slate-900/50 rounded-lg px-2 py-1.5 text-xs font-bold ${isHit ? 'text-emerald-400' : 'text-white'} outline-none`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
