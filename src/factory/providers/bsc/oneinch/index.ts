import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import FACTORY_ABI from './abi.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FACTORY_ADDRESS = '0xD41B24bbA51fAc0E4827b6F94C0D6DDeB183cD64';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 4994614) return {};

  const pools = await util.executeCall(
    FACTORY_ADDRESS,
    FACTORY_ABI,
    'getAllPools',
    [],
    block,
    chain,
    web3,
  );

  if (!pools) {
    return {};
  }

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const results = await util.executeCallOfMultiTargets(
    pools,
    ERC20_ABI,
    'totalSupply',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  results.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      balanceResults.push({
        token: pools[index].toLowerCase(),
        balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  return { balances };
}

export { tvl };
