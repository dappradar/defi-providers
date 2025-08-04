import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const POOLS = [
  'EQCHHakhWxSQIWbw6ioW21YnjVKBCDd_gVjF9Mz9_dIuFy23',
  'EQC_-t0nCnOFMdp7E7qPxAOCbCWGFz-e3pwxb6tTvFmshjt5',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const aggregatedBalances: Record<string, string> = {};

  for (const poolAddress of POOLS) {
    const poolBalances = await web3.eth.getAccountBalances(poolAddress);
    for (const [asset, amount] of Object.entries(poolBalances)) {
      const SAmount = amount as string;
      if (aggregatedBalances[asset]) {
        aggregatedBalances[asset] = (
          BigInt(aggregatedBalances[asset]) + BigInt(SAmount)
        ).toString();
      } else {
        aggregatedBalances[asset] = SAmount;
      }
    }
  }

  formatter.convertBalancesToFixed(aggregatedBalances);
  return { balances: aggregatedBalances };
}

export { tvl };
