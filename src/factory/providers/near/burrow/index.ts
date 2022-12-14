import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 62303110;
const BURROW_CONTRACT = 'contract.main.burrow.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const assetsCallResponse = await web3.eth.callContractFunction(
    BURROW_CONTRACT,
    'get_assets_paged',
    {},
    block,
  );

  const assets = assetsCallResponse.map(([asset]) => asset);
  const amounts = assetsCallResponse.map(
    (amount) => amount[1].supplied.balance,
  );
  for (const asset of assets) {
    balances[asset] = amounts[assets.indexOf(asset)];
  }
  return { balances };
}

export { tvl };
