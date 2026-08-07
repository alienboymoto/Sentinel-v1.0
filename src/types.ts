export type SmaConfig = {
  period: string;
  tf: string;
};

export type AlertConfig = {
  price: string;
  triggered: boolean;
};

export type CoinState = {
  symbol: string;
  displayName: string;
  smas: SmaConfig[];
  alerts: AlertConfig[];
  lastPrice: number;
  currentPrice: number;
};
