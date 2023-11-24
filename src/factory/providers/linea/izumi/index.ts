import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import LIQUIDITY_MANAGER_ABI from './liquidityManagerAbi.json';

const START_BLOCK = 2094;
const LIQUIDITY_MANAGERS = [
  { address: '0x1CB60033F61e4fc171c963f0d2d3F63Ece24319c', startBlock: 2094 },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  for (const liquidityManager of LIQUIDITY_MANAGERS) {
    if (block >= liquidityManager.startBlock) {
      let pools = {};
      try {
        pools = await basicUtil.readFromCache(
          `${liquidityManager.address}_pools.json`,
          chain,
          provider,
        );
      } catch {}

      while (true) {
        let exit = false;

        const poolMetas = await util.executeMultiCallsOfTarget(
          liquidityManager.address,
          LIQUIDITY_MANAGER_ABI,
          'poolMetas',
          Array.from({ length: 10 }, (v, index) => [
            index + 1 + Object.keys(pools).length,
          ]),
          block,
          chain,
          web3,
        );
        const poolAddresses = await util.executeMultiCallsOfTarget(
          liquidityManager.address,
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
            .map(
              (poolMeta: { tokenX: string; tokenY: string; fee: string }) => [
                poolMeta.tokenX,
                poolMeta.tokenY,
                poolMeta.fee,
              ],
            ),
          block,
          chain,
          web3,
        );

        poolAddresses.forEach((poolAddress, index) => {
          pools[poolAddress] = [
            poolMetas[index].tokenX,
            poolMetas[index].tokenY,
          ];
        });

        if (exit) break;
      }

      await basicUtil.saveIntoCache(
        `${liquidityManager.address}_pools.json`,
        'pools.json',
        chain,
        provider,
      );

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
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
