import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const START_BLOCK = 1407404;
const FACTORY_ADDRESSES = [
  'KT1FWHLMk5tHbwuSsp31S4Jum4dTVmkXpfJw',
  'KT1PvEyN1xCFCgorN92QCfYjw3axS6jawCiJ',
  'KT1SwH9P1Tx8a58Mm6qBExQFTcy2rwZyZiXS',
  'KT1GDtv3sqhWeSsXLWgcGsmoH5nRRGJd8xVc',
  'KT1Lw8hCoaBrHeTeMXbqHPG4sS4K1xn7yKcD',
  'KT1K7whn5yHucGXMN7ymfKiX5r534QeaJM29',
  'KT1MMLb2FVrrE9Do74J3FH1RNNc4QhDuVCNX',
];

const FARM_FACTORY_ADDRESSES = [
  'KT1VgrfMd2PUN1Y2yQfCBaxn6yzXwrXR8YWy',
  'KT1SDLvKnyrZTFStVHRP9CMJhdPxsW116iqU',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  let pools = {};

  try {
    pools = await basicUtil.readDataFromFile(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  for (const factory of FACTORY_ADDRESSES) {
    pools[factory] = pools[factory] || [];

    const contract = new web3.eth.Contract(null, factory);
    await contract.init();

    const counter = await contract.methods.counter().call(null, block);

    if (pools[factory].length < counter) {
      const tokenExchange = await contract.methods
        .getBigmap('token_to_exchange')
        .call(null, block);
      for (let i = pools[factory].length; i < counter; i++) {
        pools[factory].push(tokenExchange[i].value);
      }
    }

    for (const pool of pools[factory]) {
      let tokenBalances;
      let xtzBalance;
      try {
        [tokenBalances, xtzBalance] = await Promise.all([
          web3.eth.getAllTokensBalances(pool, block),
          web3.eth.getBalance(pool, block),
        ]);
      } catch {}
      if (BigNumber(xtzBalance).isGreaterThan(0)) {
        balances['xtz'] = BigNumber(balances['xtz'] || 0).plus(xtzBalance);
      }

      formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
    }
  }

  for (const farmFactory of FARM_FACTORY_ADDRESSES) {
    pools[farmFactory] = pools[farmFactory] || [];

    const farmFactoryContract = new web3.eth.Contract(null, farmFactory);
    await farmFactoryContract.init();

    const poolCounter = await farmFactoryContract.methods
      .pool_counter()
      .call(null, block);

    if (pools[farmFactory].length < poolCounter) {
      const stakingPools = await farmFactoryContract.methods
        .getBigmap('staking_pools')
        .call(null, block);
      for (let i = pools[farmFactory].length; i < poolCounter; i++) {
        pools[farmFactory].push(stakingPools[i].value);
      }
    }

    for (const pool of pools[farmFactory]) {
      let tokenBalances;
      let xtzBalance;
      try {
        [tokenBalances, xtzBalance] = await Promise.all([
          web3.eth.getAllTokensBalances(pool, block),
          web3.eth.getBalance(pool, block),
        ]);
      } catch {}
      if (xtzBalance.isGreaterThan(0)) {
        balances['xtz'] = BigNumber(balances['xtz'] || 0).plus(xtzBalance);
      }

      formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
    }
  }

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
