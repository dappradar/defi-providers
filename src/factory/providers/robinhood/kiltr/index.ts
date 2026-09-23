import BigNumber from 'bignumber.js';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

// Kiltr — Balancer-style AMM on Robinhood Chain (chainId 4663). Every pool token sits in one of two Vaults,
// so TVL = Vault ERC-20 balances (pool tokens held by the Vault excluded).
const V2_VAULT = '0x8d1addff942c185e81848a19203b994f5cf07df2';
const V3_VAULT = '0x371bd29a7befc4efcdfa2c5261316c74843573d3';
const V2_START = 67292293;
const V3_START = 67292959;
// v2 Vault: TokensRegistered(bytes32 indexed poolId, address[] tokens, address[] assetManagers)
const V2_TOKENS_REGISTERED =
  '0xf5847d3f2197b16cdcd2098ec95d0905cd1abdaf415f07bb7cef2bba8ac5dec4';
// v2 Vault: PoolRegistered(bytes32 indexed poolId, address indexed poolAddress, uint8 specialization)
const V2_POOL_REGISTERED =
  '0x3c13bc30b8e878c53fd2a36b679409c073afd75950be43d8858768e956fbc20e';
// v3 Vault: PoolRegistered(address indexed pool, address indexed factory, ...)
const V3_POOL_REGISTERED =
  '0xbc1561eeab9f40962e2fb827a7ff9c7cdb47a9d7c84caeefa4ed90e043842dad';
const GET_POOL_TOKENS_ABI = {
  inputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
  name: 'getPoolTokens',
  outputs: [{ internalType: 'contract IERC20[]', name: 'tokens', type: 'address[]' }],
  stateMutability: 'view',
  type: 'function',
};
const BLOCKS_LIMIT = 10000;

async function scanLogs(from: number, to: number, topic: string, target: string, web3) {
  const out = [];
  for (let i = from; i <= to; i += BLOCKS_LIMIT) {
    const logs = (
      await util.getLogs(i, Math.min(i + BLOCKS_LIMIT - 1, to), topic, target, web3)
    ).output;
    Array.prototype.push.apply(out, logs);
  }
  return out;
}

function decodeAddressArray(data: string): string[] {
  // abi: (address[] tokens, address[] assetManagers) -> offset words then length-prefixed arrays
  const words = data.slice(2).match(/.{64}/g) || [];
  const offset = parseInt(words[0], 16) / 32;
  const len = parseInt(words[offset], 16);
  return words.slice(offset + 1, offset + 1 + len).map((w) => `0x${w.slice(24)}`.toLowerCase());
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V2_START) return {};

  let cache;
  try {
    cache = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {
    cache = { start: V2_START, pools: [], v2Tokens: [], v3Tokens: [] };
  }
  const from = Math.max(cache.start, V2_START);
  if (from <= block) {
    // sequential: public Robinhood Chain RPCs rate-limit parallel getLogs bursts
    const v2Pools = await scanLogs(from, block, V2_POOL_REGISTERED, V2_VAULT, web3);
    const v2Tokens = await scanLogs(from, block, V2_TOKENS_REGISTERED, V2_VAULT, web3);
    const v3Pools = await scanLogs(Math.max(from, V3_START), block, V3_POOL_REGISTERED, V3_VAULT, web3);
    const v3PoolAddrs = v3Pools.map((l) => `0x${l.topics[1].slice(26)}`.toLowerCase());
    const v3Tokens = v3PoolAddrs.length
      ? (
          await util.executeCallOfMultiTargets(
            v3PoolAddrs.map(() => V3_VAULT),
            [GET_POOL_TOKENS_ABI],
            'getPoolTokens',
            [],
            block,
            chain,
            web3,
          )
        ).flatMap((r, i) => (r ? r : []))
      : [];
    cache.pools = [
      ...new Set([
        ...cache.pools,
        ...v2Pools.map((l) => `0x${l.topics[2].slice(26)}`.toLowerCase()),
        ...v3PoolAddrs,
      ]),
    ];
    cache.v2Tokens = [...new Set([...cache.v2Tokens, ...v2Tokens.flatMap((l) => decodeAddressArray(l.data))])];
    cache.v3Tokens = [...new Set([...cache.v3Tokens, ...v3Tokens.map((t: string) => t.toLowerCase())])];
    cache.start = block + 1;
    await basicUtil.saveIntoCache(cache, 'cache/pools.json', chain, provider);
  }

  const poolTokens = new Set(cache.pools);
  const balances = {};
  for (const [vault, tokens] of [
    [V2_VAULT, cache.v2Tokens],
    [V3_VAULT, cache.v3Tokens],
  ] as [string, string[]][]) {
    const held = tokens.filter((t) => !poolTokens.has(t));
    if (!held.length) continue;
    const results = await util.getTokenBalances(vault, held, block, chain, web3);
    formatter.sumMultiBalanceOf(balances, results);
  }
  formatter.convertBalancesToFixed(balances);
  log.info({ message: `kiltr tvl on ${chain} at ${block}: ${Object.keys(balances).length} tokens`, endpoint: 'tvl' });
  return { balances };
}

export { tvl };
