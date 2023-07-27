export interface HealthCheckReply {
  run: boolean;
}

export interface GetTokenDetailsRequest {
  provider: string;
  chain: string;
}

export interface GetTokenDetailsReply {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo: string;
}

export interface GetTvlRequest {
  provider: string;
  chain: string;
  block: string;
  date: string;
  autointegrationParams: AutointegrationParams;
}

export interface GetTvlReply {
  balances: { [key: string]: string };
  poolBalances: { [key: string]: PoolBalance };
}

export interface GetTvlReply_BalancesEntry {
  key: string;
  value: string;
}

export interface GetTvlReply_PoolBalancesEntry {
  key: string;
  value: PoolBalance | undefined;
}

export interface PoolBalance {
  tokens: string[];
  balances: string[];
}

export interface GetPoolAndTokenVolumesRequest {
  provider: string;
  chain: string;
  block: string;
  pools: string[];
  tokens: string[];
}

export interface GetPoolAndTokenVolumesReply {
  poolVolumes: { [key: string]: PoolVolume };
  tokenVolumes: { [key: string]: TokenVolume };
}

export interface GetPoolAndTokenVolumesReply_PoolVolumesEntry {
  key: string;
  value: PoolVolume | undefined;
}

export interface GetPoolAndTokenVolumesReply_TokenVolumesEntry {
  key: string;
  value: TokenVolume | undefined;
}

export interface PoolVolume {
  volumes: string[];
  volumeUsd: string;
}

export interface TokenVolume {
  volume: string;
  volumeUsd: string;
}

export interface AutointegrationParams {
  autointegrated: boolean;
  dappType: string | undefined;
  addresses: string | undefined;
}
