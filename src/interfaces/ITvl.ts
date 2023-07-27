export interface ITvlParams {
  chain: string;
  provider: string;
  block: number;
  date: string;
  web3: any;
}

export interface ITvlAutointegrationParams extends ITvlParams {
  dappType: string;
  addresses: string;
}

export interface ITvlReturn {
  balances: { [key: string]: string };
  poolBalances: { [key: string]: PoolBalance };
}

export interface IBalances {
  [key: string]: string;
}

export interface PoolBalance {
  tokens: string[];
  balances: string[];
}
