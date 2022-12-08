export interface ITvlParams {
  chain: string;
  provider: string;
  block: number;
  date: string;
  web3: any;
}

export interface ITvlReturn {
  balances: { [key: string]: string };
  poolBalances: { [key: string]: PoolBalance };
}

export interface PoolBalance {
  tokens: string[];
  balances: string[];
}
