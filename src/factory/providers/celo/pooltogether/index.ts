import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKENS = [
  '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
  '0x765de816845861e75a25fca122bb6898b8b1282a',
  '0x471ece3750da237f93b8e339c536989b8978a438',
];
const POOLS = [
  '0x0adc779f82a1fdc50dccae765f2bff73af85992c',
  '0x119f887a08d65b4ccd331831d43a23620fda4794',
  '0x339e486a8b9d248caae0542189c4b2439b53f7a2',
  '0x61647d7ac11785873ce9c89c362c612b62ed5858',
  '0x6f634f531ed0043b94527f68ec7861b4b1ab110d',
  '0xbe55435bda8f0a2a20d2ce98cc21b0af5bfb7c83',
  '0xd52fad1442c14871c11c6251a3bd97a8c10d4909',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 8470243) {
    return {};
  }

  const tokenBalances = await util.getTokenBalancesOfEachHolder(
    POOLS,
    TOKENS,
    block,
    chain,
    web3,
  );

  const balances = {};

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
