import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const LINEAR_CONTRACT = 'linear-protocol.near';
const PHOENIX_BONDS_CONTRACT = 'phoenix-bonds.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;

  const balances: Record<string, string> = {};

  const linearPrice = (await web3.eth.callContractFunction(
    LINEAR_CONTRACT,
    'ft_price',
    {},
    block,
  )) as string;

  const summary = await web3.eth.callContractFunction(
    PHOENIX_BONDS_CONTRACT,
    'get_summary',
    {
      linear_price: linearPrice,
    },
    block,
  );

  const linearBalance = summary.linear_balance;

  const nearValue = new BigNumber(linearPrice)
    .multipliedBy(new BigNumber(linearBalance).div(new BigNumber(10).pow(24)))
    .toFixed();

  balances['near'] = nearValue;

  return { balances };
}

export { tvl };
