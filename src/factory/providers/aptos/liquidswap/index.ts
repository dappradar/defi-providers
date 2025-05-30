import formatter from 'src/util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = await web3.eth.dexExport({
    account:
      '0x05a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948',
    poolStr: 'liquidity_pool::LiquidityPool',
  });
  const liqPool = await web3.eth.dexExport({
    account:
      '0x61d2c22a6cb7831bee0f48363b0eec92369357aece0d1142062f7d5d85c7bef8',
    poolStr: 'liquidity_pool::LiquidityPool',
  });
  Object.entries(liqPool).forEach(([address, balance]) => {
    if (!balances[address]) {
      balances[address] = balance;
    } else balances[address] = balances[address].plus(balance);
  });
  formatter.mapAptosTokenAddresses(balances);
  return {
    balances,
  };
}

export { tvl };
