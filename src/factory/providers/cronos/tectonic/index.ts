import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import underlyingAbi from './abi.json';
const START_BLOCK = 2100000;

const MARKETS = [
  '0x543F4Db9BD26C9Eb6aD4DD1C33522c966C625774', // WETH
  '0x67fD498E94d95972a4A2a44AccE00a000AF7Fe00', // WBTC
  '0xB3bbf1bE947b245Aef26e3B6a9D777d7703F4c8e', // USDC
  '0xA683fdfD9286eeDfeA81CF6dA14703DA683c44E5', // USDT
  '0xE1c4c56f772686909c28C319079D41adFD6ec89b', // DAI
  '0x4bD41f188f6A05F02b46BB2a1f8ba776e528F9D2', // TUSD
  '0xfe6934FDf050854749945921fAA83191Bccf20Ad', // TONIC,
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }
  const underlyings = await util.executeCallOfMultiTargets(
    MARKETS,
    underlyingAbi,
    'underlying',
    [],
    block,
    chain,
    web3,
  );
  const balanceResults = await util.getTokenBalancesOfHolders(
    MARKETS,
    underlyings,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
