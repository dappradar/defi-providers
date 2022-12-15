import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CONTRACTS = [
  '0x5199071825CC1d6cd019B0D7D42B08106f6CF16D',
  '0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e',
  '0xD54f502e184B6B739d7D27a6410a67dc462D69c8',
];

const TOKENS = [
  '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  const balanceResults = await Promise.all(
    TOKENS.map((token) =>
      util.getTokenBalancesOfHolders(
        CONTRACTS,
        CONTRACTS.map((c) => token),
        block,
        chain,
        web3,
      ),
    ),
  );
  balanceResults.forEach((results) => {
    formatter.sumMultiBalanceOf(balances, results);
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
