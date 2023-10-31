import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CONTRACTS = [
  '0xE3cbE3A636AB6A754e9e41B12b09d09Ce9E53Db3',
];

const TOKENS = [
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
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
