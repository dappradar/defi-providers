import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import FEW_TOKEN_ABI from '../../../../constants/abi/fewErc20.json';
import BigNumber from 'bignumber.js';

const START_BLOCK = 285379026;
const FACTORY_ADDRESS = '0x1246Fa62467a9AC0892a2d2A9F9aafC2F5609442';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );
  formatter.convertBalancesToFixed(balances);

  const newBalances = {};

  const fewTokens = Object.keys(balances);
  const originTokens = await util.executeMultiCallsOfMultiTargets(
    fewTokens.map((address) => address),
    FEW_TOKEN_ABI,
    'token',
    fewTokens.map(() => []),
    block,
    chain,
    web3,
  );

  fewTokens.forEach((fewToken, index) => {
    const originToken = originTokens[index];
    if (originToken) {
      const token = originToken.toLowerCase();
      if (newBalances[token]) {
        newBalances[token] = BigNumber(newBalances[token])
          .plus(balances[fewToken])
          .toFixed();
      } else {
        newBalances[token] = balances[fewToken];
      }
    } else {
      if (newBalances[fewToken]) {
        newBalances[fewToken] = BigNumber(newBalances[fewToken])
          .plus(balances[fewToken])
          .toFixed();
      } else {
        newBalances[fewToken] = balances[fewToken];
      }
    }
  });

  return { balances: newBalances, poolBalances };
}

export { tvl };
