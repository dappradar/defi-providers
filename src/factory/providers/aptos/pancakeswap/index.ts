import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = await web3.eth.dexExport({
    account:
      '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
    poolStr: 'swap::TokenPairReserve',
    token0Reserve: (i) => i.data.reserve_x,
    token1Reserve: (i) => i.data.reserve_y,
  });
  formatter.convertBalancesToFixed(balances);
  return {
    balances,
  };
}

export { tvl };
