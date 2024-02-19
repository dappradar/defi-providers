import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  const resourcesCache = await web3.eth.getResources(
    '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3',
  );
  const coinContainers = resourcesCache
    .filter((token) =>
      token.type.includes(
        '0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3::reserve::ReserveCoinContainer',
      ),
    )
    .map((i) => ({
      lamports: i.data.underlying_coin.value,
      tokenAddress: i.type.slice(
        i.type.indexOf('<') + 1,
        i.type.lastIndexOf('>'),
      ),
    }));
  coinContainers.forEach((token) => {
    balances[token.tokenAddress.toLowerCase()] = token.lamports;
  });
  return {
    balances,
  };
}
export { tvl };
