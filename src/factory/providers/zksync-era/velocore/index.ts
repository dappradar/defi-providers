import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import factoryAbi from './factoryAbi.json';

const START_BLOCK = 464690;
const FACTORY_ADDRESS = '0xe140eac2bb748c8f456719a457f26636617bb0e9';
const STAKING_CONTRACT = '0xbde345771eb0c6adebc54f41a169ff6311fe096f';
const VELOCORE_TOKEN = '0x85d84c774cf8e9ff85342684b0e795df72a24908';
const FACTORY_ADDRESS_V2 = '0xf55150000aac457eCC88b34dA9291e3F6E7DB165';
const VAULT_ADDRESS_V2 = '0xf5E67261CB357eDb6C7719fEFAFaaB280cB5E2A6';
const E_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const stakingBalance = await util.getTokenBalances(
    STAKING_CONTRACT,
    [VELOCORE_TOKEN],
    block,
    chain,
    web3,
  );

  const contract = new web3.eth.Contract(factoryAbi, FACTORY_ADDRESS_V2);

  const canonicalPools = await contract.methods['canonicalPools'](
    FACTORY_ADDRESS_V2,
    0,
    1000,
  ).call(null, block);

  const wombatGauges = await contract.methods['wombatGauges'](
    FACTORY_ADDRESS_V2,
  ).call(null, block);

  const tokens: string[] = [
    ...new Set<string>(
      canonicalPools
        .concat(wombatGauges)
        .map((g) => g.poolData.listedTokens)
        .flat()
        .map((i: string) => '0x' + i.slice(2 + 24))
        .filter((address) => address !== E_ADDRESS),
    ),
  ];

  const balance = await web3.eth.getBalance(VAULT_ADDRESS_V2, block);
  balances['eth'] = balance;

  const tokenBalances = await util.getTokenBalances(
    VAULT_ADDRESS_V2,
    tokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, stakingBalance, chain, provider);
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

export { tvl };
