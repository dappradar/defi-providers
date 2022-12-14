import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 30819;
const POOLS = [
  '0xe27bff97ce92c3e1ff7aa9f86781fdd6d48f5ee9',
  '0xf44938b0125a6662f9536281ad2cd6c499f22004',
];
const USDC = '0x7f5c764cbc14f9669b88837ca1490cca17c31607';
const WETH = '0x121ab82b49b2bc4c7901ca46b8277962b4350204';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const balanceResults = await util.getTokenBalancesOfHolders(
    POOLS,
    [WETH, USDC],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);

  if (balances[WETH]) {
    balances[basicUtil.getWmainAddress(chain)] = balances[WETH];
    delete balances[WETH];
  }
  return { balances };
}
export { tvl };
