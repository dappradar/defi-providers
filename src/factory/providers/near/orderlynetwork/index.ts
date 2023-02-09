import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 78094806;
const ASSET_MANAGER_CONTRACT = 'asset-manager.orderly-network.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const listedTokens = await web3.eth.callContractFunction(
    ASSET_MANAGER_CONTRACT,
    'get_listed_tokens',
    {},
    block,
  );
  for (const listedToken of listedTokens) {
    balances[listedToken] = await web3.eth.callContractFunction(
      listedToken,
      'ft_balance_of',
      { account_id: ASSET_MANAGER_CONTRACT },
      block,
    );
  }

  balances['near'] = await web3.eth.getBalance(ASSET_MANAGER_CONTRACT, block);

  return { balances };
}

export { tvl };
