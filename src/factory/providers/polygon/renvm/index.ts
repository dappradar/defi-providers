import util from '../../../../util/blockchainUtil';
import REGISTRY_ABI from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const GATEWAY_REGISTRY_ADDRESS = '0x21C482f153D0317fe85C60bE1F7fa079019fcEbD';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 14937138) {
    return {};
  }

  const balances = {};

  const tokens = await util.executeCall(
    GATEWAY_REGISTRY_ADDRESS,
    REGISTRY_ABI,
    'getRenTokens',
    [util.ZERO_ADDRESS, 0],
    block,
    chain,
    web3,
  );

  const results = await util.getTokenTotalSupplies(tokens, block, chain, web3);
  results.forEach((result) => {
    if (result && result.totalSupply.isGreaterThan(0)) {
      balances[result.token] = result.totalSupply.toFixed();
    }
  });
  return { balances };
}

export { tvl };
