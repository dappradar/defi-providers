import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 19148158;
const OWNERS = [
  '0x4bcb9Ea3dACb8FfE623317E0B102393A3976053C',
  '0x6a63cbf00D15137756189c29496B14998b259254',
  '0xE7E1b1F216d81a4b2c018657f26Eda8FE2F91e26',
  '0xeC938Bc5b201E96b6AFE97070a8Ea967E0dcAe96',
];
const TOKENS = [
  '0x5832f53d147b3d6Cd4578B9CBD62425C7ea9d0Bd',
  '0x5b1fb849f1f76217246b8aaac053b5c7b15b7dc3',
  '0x9410e8052bc661041e5cb27fdf7d9e9e842af2aa',
  '0x8BB97A618211695f5a6a889faC3546D1a573ea77',
  '0x7A6888c85eDBA8E38F6C7E0485212da602761C08',
  '0x5a2aa871954eBdf89b1547e75d032598356caad5',
  '0xe04d21d999faedf1e72ade6629e20a11a1ed14fa',
  '0xe85411c030fb32a9d8b14bbbc6cb19417391f711',
  '0xbb4a26a053b217bb28766a4ed4b062c3b4de58ce',
  '0x000734cf9e469bad78c8ec1b0deed83d0a03c1f8',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const tokenBalances = await util.getTokenBalancesOfEachHolder(
    OWNERS,
    TOKENS,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
