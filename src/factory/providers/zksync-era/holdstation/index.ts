import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import ERC20_ABI from '../../../../constants/abi/erc20.json';

const START_BLOCK = 3242317;
const VAULT_ADDRESS = '0xaf08a9d918f16332F22cf8Dc9ABE9D9E14DdcbC2';
const USDC = '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4';
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const usdcBalance = await util.executeMultiCallsOfTarget(
    USDC,
    ERC20_ABI,
    'balanceOf',
    [VAULT_ADDRESS],
    block,
    chain,
    web3,
  );
  formatter.convertBalancesToFixed(balances);

  return { balances: { [USDC]: usdcBalance.toString() } };
}

export { tvl };
