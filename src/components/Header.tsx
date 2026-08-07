import { Play, Pause, Timer } from 'lucide-react';

export default function Header({
  isActive,
  setIsActive,
  timeLeft
}: {
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  timeLeft: number;
}) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-8 py-4 md:py-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.355r-.01.011m0 0a11.001 11.001 0 0010.459-6.755 11.001 11.001 0 00-10.459-6.755 11.001 11.001 0 00-10.459 6.755 11.001 11.001 0 0010.459 6.755z"></path></svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Sentinel <span className="text-sky-400">v1.0</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold leading-none mb-0.5">Next Scan</p>
            <p className="text-lg font-mono text-sky-400 font-bold leading-none">{timeStr}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-full border border-slate-700 shadow-inner w-full sm:w-auto justify-center">
          <button
            onClick={() => setIsActive(true)}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              isActive
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white cursor-pointer'
            }`}
          >
            ACTIVE
          </button>
          <button
            onClick={() => setIsActive(false)}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              !isActive
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white cursor-pointer'
            }`}
          >
            PAUSED
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Next Scan</p>
            <p className="text-2xl font-mono text-sky-400 font-bold">{timeStr}</p>
          </div>
          <div className="w-10 h-10 border-2 border-slate-800 rounded-full flex items-center justify-center">
            <div className={`w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full ${isActive ? 'animate-spin' : ''}`}></div>
          </div>
        </div>
      </div>
    </header>
  );
}
