import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOLS = [
  '0x1216Be0c4328E75aE9ADF726141C2254c2Dcc1b6',
  '0x19Ca3baAEAf37b857026dfEd3A0Ba63987A1008D',
  '0xd6B3B86209eBb3C608f3F42Bf52818169944E402',
];

const TOKENS = [
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 8487814) {
    return {};
  }

  const balanceResults = await util.getTokenBalancesOfEachHolder(
    POOLS,
    TOKENS,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
