import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import POOL_DATA_PROVIDER_V3_ABI from './abi/poolDataProviderV3Abi.json';
import AAVE_ERC20_ABI from './abi/aaveErc20Abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 11700000;
const POOL_DATA_PROVIDER_V3 = '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654';

async function getAddresses(poolDataProviderV3, block, chain, web3) {
  const aaveTokenMarketData = await util.executeCall(
    poolDataProviderV3,
    POOL_DATA_PROVIDER_V3_ABI,
    'getAllATokens',
    [],
    block,
    chain,
    web3,
  );

  const aaveTokenAddresses = [];
  aaveTokenMarketData.map((aaveTokensData) => {
    if (aaveTokensData) {
      aaveTokenAddresses.push(
        typeof aaveTokensData == 'string'
          ? aaveTokensData.substring(aaveTokensData.indexOf(',') + 1)
          : aaveTokensData.tokenAddress,
      );
    }
  });

  const underlyingAddressesData = await util.executeCallOfMultiTargets(
    aaveTokenAddresses,
    AAVE_ERC20_ABI,
    'UNDERLYING_ASSET_ADDRESS',
    [],
    block,
    chain,
    web3,
  );

  const reserveTokenAddresses = underlyingAddressesData.map(
    (reserveData) => reserveData,
  );

  return [aaveTokenAddresses, reserveTokenAddresses];
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const [aaveTokens, reserveTokens] = await getAddresses(
    POOL_DATA_PROVIDER_V3,
    block,
    chain,
    web3,
  );

  const balanceResults = await util.getTokenBalancesOfHolders(
    aaveTokens,
    reserveTokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
