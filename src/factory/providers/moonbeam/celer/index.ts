import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const liquidityBridgeContractsV2 = '0x841ce48f9446c8e281d3f1444cb859b4a6d0738c';
const liquidityBridgeTokens = [
  '0x3fd9b6c9a24e09f67b7b706d72864aebb439100c', //ZLK
];

const peggedTokens = [
  '0x81ecac0d6be0550a00ff064a4f9dd2400585fe9c', // usdt
  '0x6a2d262d56735dba19dd70682b39f6be9a931d98', // usdc
  '0xcb4a7569a61300c50cf80a2be16329ad9f5f8f9e', // busd
  '0x6959027f7850adf4916ff5fdc898d958819e5375', // weth
  '0x8a4b4c2acadeaa7206df96f00052e41d74a015ce', //wbtc
  '0x3795c36e7d12a8c252a20c5a7b455f7c57b60283', //celr
  '0xc5ef662b833de914b9ba7a3532c6bb008a9b23a6', //frax
  '0x54f2980a851376ccbc561ab4631df2556ad03386', //fxs
  '0x8006320739fc281da67ee62eb9b4ef8add5c903a', //conv
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 177152) {
    return {};
  }

  const balances = {};

  const tokenBalances = await util.getTokenBalances(
    liquidityBridgeContractsV2,
    liquidityBridgeTokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);

  const supply = await util.executeCallOfMultiTargets(
    peggedTokens,
    ERC20_ABI,
    'totalSupply',
    [],
    block,
    chain,
    web3,
  );

  supply.forEach((totalSupply, index) => {
    if (totalSupply) {
      if (!balances[peggedTokens[index]]) {
        balances[peggedTokens[index]] = BigNumber(0);
      }
      balances[peggedTokens[index]] =
        balances[peggedTokens[index]].plus(totalSupply);
    }
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
