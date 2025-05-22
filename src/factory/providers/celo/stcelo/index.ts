import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';

const START_BLOCK = 13823413;
const STCELO_ADDRESS = '0x4aAD04D41FD7fd495503731C5a2579e19054C432';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  const amount = (await util.executeCall(
    STCELO_ADDRESS,
    abi,
    'getTotalCelo',
    [],
    block,
    chain,
    web3,
  )) as string[];

  balances[WMAIN_ADDRESS[chain]] = amount;

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
