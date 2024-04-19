import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import VAULT_ABI from './abi.json';

const START_BLOCK = 28541484;
const VAULT_ADDRESS = '0x703500cAF3c79aF68BB3dc85A6846d1C7999C672';
const USDC = '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const numCollaterals = await util.executeCall(
    VAULT_ADDRESS,
    VAULT_ABI,
    'getNumberOfCollaterals',
    [],
    block,
    chain,
    web3,
  );

  const collaterals = await util.executeMultiCallsOfTarget(
    VAULT_ADDRESS,
    VAULT_ABI,
    'getWhitelistedCollateral',
    Array.from({ length: numCollaterals }, (v, i) => [i]),
    block,
    chain,
    web3,
  );

  const balanceResults = await util.getTokenBalances(
    VAULT_ADDRESS,
    collaterals.map((collateral) => collateral.asset),
    block,
    chain,
    web3,
  );

  // replace UA with USDC address
  const ua = collaterals.shift();
  collaterals.unshift({ token: USDC, balance: ua.balance });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
