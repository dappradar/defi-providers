import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';

const FACTORY_ADDRESS = '0xCe9240869391928253Ed9cc9Bcb8cb98CB5B0722';
const BASE_TOKEN = {
  '0x4cfa50b7ce747e2d61724fcac57f24b748ff2b2a':
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  '0xe80772eaf6e2e18b651f160bc9158b2a5cafca65':
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  '0xeb8e93a0c7504bffd8a8ffa56cd754c63aaebfe8':
    '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  '0x6a7661795c374c0bfc635934efaddff3a7ee23b6':
    '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  '0x93b346b6bc2548da6a1e7d98e9a421b42541425b':
    '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  '0xec13336bbd50790a00cdc0feddf11287eaf92529':
    '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
  '0x178412e79c25968a32e89b11f63b33f733770c2a':
    '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  '0x95aB45875cFFdba1E5f451B950bC2E42c0053f39':
    '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
};
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  Object.keys(balances).forEach((tokenId) => {
    if (BASE_TOKEN[tokenId]) {
      if (balances[BASE_TOKEN[tokenId]]) {
        balances[BASE_TOKEN[tokenId]] = BigNumber(balances[tokenId])
          .plus(balances[BASE_TOKEN[tokenId]])
          .toString();
      } else {
        balances[BASE_TOKEN[tokenId]] = BigNumber(balances[tokenId]).toString();
      }
    }
  });
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
