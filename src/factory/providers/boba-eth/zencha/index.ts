import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const OWNER = '0x2D027B49B8960810F84D5fE172d07FFf62311852';
const DAI = '0xf74195Bb8a5cf652411867c5C2C5b8C2a402be35';
const USDC = '0x66a2A913e447d6b4BF33EFbec43aAeF87890FBbc';
const USDT = '0x5DE1677344D3Cb0D7D465c10b72A8f60699C062d';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  const balanceResults = await util.getTokenBalances(
    OWNER,
    [DAI, USDC, USDT],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}
export { tvl };
