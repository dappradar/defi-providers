export interface ITvlParams {
  chain: string;
  provider: string;
  block: number;
  date: string;
  web3: any;
}

export interface ITvlBalancesReturn {
  balances: { [key: string]: string };
}

export interface ITvlBalancesPoolBalancesReturn {
  balances: { [key: string]: string };
  poolBalances: { [key: string]: PoolBalance };
}

export interface PoolBalance {
  tokens: string[];
  balances: string[];
}
