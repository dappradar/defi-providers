import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const EXCHANGE_ADDRESS =
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap-v2-1';
const WSTX_ADDRESS =
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.wrapped-stx-token';
const VAULT_ADDRESSES = [
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stx-reserve-v1-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-sip10-reserve-v2-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-freddie-v1-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-auction-engine-v3-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-dao',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-governance-v1-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-governance-v2-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-governance-v3-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-v1-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-2-v1-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-3-v1-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-4-v1-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-claim-yield-v2-1',
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stake-pool-diko-v1-2',
];
const STDIKO_ADDRESS = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.stdiko-token';

async function calculateDexTvl(block, balances, web3) {
  const accountBalances = await web3.eth.getAccountBalances(
    EXCHANGE_ADDRESS,
    block,
  );

  web3.eth.extractBalances(accountBalances, balances);

  // STX value is already taken into account, WSTX dublicates it
  delete balances[WSTX_ADDRESS];
}

async function calculateVaultTvl(block, balances, web3) {
  let accountBalances;

  for (const token of VAULT_ADDRESSES) {
    accountBalances = await web3.eth.getAccountBalances(token, block);
    web3.eth.extractBalances(accountBalances, balances);
  }

  // Staked DIKO value is already taken into account, STDIKO dublicates it
  delete balances[STDIKO_ADDRESS];
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 34239) {
    return {};
  }

  const balances = {};

  await calculateDexTvl(block, balances, web3);
  await calculateVaultTvl(block, balances, web3);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
