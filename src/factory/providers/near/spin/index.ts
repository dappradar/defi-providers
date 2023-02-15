import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 64029975;
const PERP_CONTRACT_DEPLOYMENT_BLOCK = 76675489;
const SPOT_CONTRACT = 'spot.spin-fi.near';
const PERP_CONTRACT = 'v2_0_2.perp.spin-fi.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const tokens = (
    await web3.eth.callContractFunction(
      SPOT_CONTRACT,
      'get_currencies',
      {},
      block,
    )
  )
    .filter((token) => token['address'] !== 'near.near')
    .map((token) => token['address']);

  for (const token of tokens) {
    balances[token] = await web3.eth.callContractFunction(
      token,
      'ft_balance_of',
      { account_id: SPOT_CONTRACT },
      block,
    );
  }

  balances['near'] = BigNumber(balances['near'] || 0)
    .plus(await web3.eth.getBalance(SPOT_CONTRACT, block))
    .toFixed();

  if (block >= PERP_CONTRACT_DEPLOYMENT_BLOCK) {
    const baseCurrency = (
      await web3.eth.callContractFunction(
        PERP_CONTRACT,
        'get_base_currency',
        {},
        block,
      )
    )['address'];
    balances[baseCurrency] = BigNumber(balances[baseCurrency] || 0)
      .plus(
        await web3.eth.callContractFunction(
          baseCurrency,
          'ft_balance_of',
          { account_id: PERP_CONTRACT },
          block,
        ),
      )
      .toFixed();
  }

  return { balances };
}

export { tvl };
