import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import VAULT_ABI from './abi.json';

const START_BLOCK = 28541484;
const VAULT_ADDRESS = '0x703500cAF3c79aF68BB3dc85A6846d1C7999C672';
const USDC = '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4';
type Collateral = {
  asset: string;
  weight: BigInt;
  decimals: number;
  currentAmount: BigInt;
  maxAmount: BigInt;
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  let collaterals: Collateral[] = [];
  try {
    collaterals = await basicUtil.readFromCache(
      'cache/collaterals.json',
      chain,
      provider,
    );
  } catch {}

  const numCollaterals = await util.executeCall(
    VAULT_ADDRESS,
    VAULT_ABI,
    'getNumberOfCollaterals',
    [],
    block,
    chain,
    web3,
  );

  if (collaterals.length < numCollaterals) {
    const newCollaterals = await util.executeMultiCallsOfTarget(
      VAULT_ADDRESS,
      VAULT_ABI,
      'getWhiteListedCollateral',
      Array.from(Array(numCollaterals - collaterals.length), (_, i) => [
        i + collaterals.length,
      ]),
      block,
      chain,
      web3,
    );

    collaterals = [...collaterals, ...newCollaterals];
    await basicUtil.saveIntoCache(
      collaterals,
      'cache/collaterals.json',
      chain,
      provider,
    );
  }

  const balanceResults = await util.getTokenBalances(
    VAULT_ADDRESS,
    collaterals.map((collateral) => collateral[0]),
    block,
    chain,
    web3,
  );

  // replace UA with USDC address
  const ua = balanceResults.shift();
  balanceResults.unshift({ token: USDC, balance: ua['balance'] });

  const balances = {};

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
