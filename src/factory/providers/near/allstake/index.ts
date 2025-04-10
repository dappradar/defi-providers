import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const ALLSTAKE_NEAR_CONTRACT = 'allstake.near';
const LINEAR_CONTRACT = 'linear-protocol.near';

interface Strategy {
  underlying_token: string;
  [key: string]: any;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;

  const balances: Record<string, string> = {};
  let linearBalance: string | null = null;

  // Get all strategies from the contract
  const strategies = (await web3.eth.callContractFunction(
    ALLSTAKE_NEAR_CONTRACT,
    'get_strategies',
    {},
    block,
  )) as Strategy[];

  const tokens: string[] = Array.from(
    new Set(strategies.map((s) => s.underlying_token)),
  );

  // Process each token
  for (const token of tokens) {
    const balance = (await web3.eth.callContractFunction(
      token,
      'ft_balance_of',
      { account_id: ALLSTAKE_NEAR_CONTRACT },
      block,
    )) as string;

    if (token === LINEAR_CONTRACT) {
      linearBalance = balance;
    } else {
      balances[token] = balance;
    }
  }

  if (linearBalance) {
    const linearPrice = (await web3.eth.callContractFunction(
      LINEAR_CONTRACT,
      'ft_price',
      {},
      block,
    )) as string;

    const nearValue = new BigNumber(linearPrice)
      .multipliedBy(new BigNumber(linearBalance).div(new BigNumber(10).pow(24)))
      .toFixed();

    balances['near'] = new BigNumber(balances['near'] || '0')
      .plus(nearValue)
      .toFixed();
  }

  return { balances };
}

export { tvl };
