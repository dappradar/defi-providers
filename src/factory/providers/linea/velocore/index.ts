import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import factoryAbi from './factoryAbi.json';

const START_BLOCK = 101965;
const FACTORY_ADDRESS = '0xaA18cDb16a4DD88a59f4c2f45b5c91d009549e06';
const VAULT_ADDRESS = '0x1d0188c4B276A09366D05d6Be06aF61a73bC7535';
const E_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const balances = {};
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances };
  }

  const contract = new web3.eth.Contract(factoryAbi, FACTORY_ADDRESS);

  const canonicalPools = await contract.methods['canonicalPools'](
    FACTORY_ADDRESS,
    0,
    1000,
  ).call(null, block);

  const wombatGauges = await contract.methods['wombatGauges'](
    FACTORY_ADDRESS,
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

  const tokenBalances = await util.getTokenBalances(
    VAULT_ADDRESS,
    tokens,
    block,
    chain,
    web3,
  );

  const balance = await web3.eth.getBalance(VAULT_ADDRESS, block);
  balances['eth'] = balance;

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
