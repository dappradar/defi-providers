import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import LIQUIDITY_MANAGER_ABI from './liquidityManagerAbi.json';

const START_BLOCK = 225074;
const LIQUIDITY_MANAGER_ADDRESS = '0x936c9a1b8f88bfdbd5066ad08e5d773bc82eb15f';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  let pools = {};
  try {
    pools = await basicUtil.readFromCache('pools.json', chain, provider);
  } catch {}

  while (true) {
    const poolMetas = await util.executeMultiCallsOfTarget(
      LIQUIDITY_MANAGER_ADDRESS,
      LIQUIDITY_MANAGER_ABI,
      'poolMetas',
      Array.from({ length: 10 }, (v, index) => [
        index + 1 + Object.keys(pools).length,
      ]),
      block,
      chain,
      web3,
    );

    let exit = false;

    const poolAddresses = await util.executeMultiCallsOfTarget(
      LIQUIDITY_MANAGER_ADDRESS,
      LIQUIDITY_MANAGER_ABI,
      'pool',
      poolMetas
        .filter((poolMeta) => {
          if (
            poolMeta.tokenX !== '0x0000000000000000000000000000000000000000'
          ) {
            return poolMeta;
          } else {
            exit = true;
          }
        })
        .map((poolMeta: { tokenX: string; tokenY: string; fee: string }) => [
          poolMeta.tokenX,
          poolMeta.tokenY,
          poolMeta.fee,
        ]),
      block,
      chain,
      web3,
    );

    poolAddresses.forEach((poolAddress, index) => {
      pools[poolAddress] = [poolMetas[index].tokenX, poolMetas[index].tokenY];
    });

    if (exit) break;
  }

  await basicUtil.saveIntoCache(pools, 'pools.json', chain, provider);

  const tokenBalances = await util.getTokenBalancesOfHolders(
    Object.keys(pools).flatMap((i) => [i, i]),
    Object.keys(pools)
      .map((tokens) => pools[tokens])
      .flat(1),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
