import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CELLANA_ADDRESS =
  '0x3b38735644d0be8ac37ebd84a1e42fa5c2487495ef8782f6c694b1a147f82426';
const LIQUIDITY_POOL_MODULE =
  '0x4bf51972879e3b95c4781a5cdcb9e1ee24ef483e7d22f2d903626f126df62bd1';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  const resources = await web3.eth.getResources(CELLANA_ADDRESS);
  const coinContainers = resources
    .filter((resource) => resource.type.includes('0x1::coin::CoinStore'))
    .map((resource) => ({
      balance: resource.data.coin.value,
      tokenAddress: resource.type.slice(
        resource.type.indexOf('<') + 1,
        resource.type.lastIndexOf('>'),
      ),
    }));

  coinContainers.forEach(({ balance, tokenAddress }) => {
    if (tokenAddress && balance !== '0') {
      formatter.merge(balances, tokenAddress, balance);
    }
  });

  try {
    const poolAddresses = await web3.eth.functionView({
      functionStr: `${LIQUIDITY_POOL_MODULE}::liquidity_pool::all_pool_addresses`,
      type_arguments: [],
      args: [],
    });

    for (const pool of poolAddresses) {
      if (!pool || !pool.inner) {
        continue;
      }

      const poolResources = await web3.eth.getResources(pool.inner);
      const liquidityPool = poolResources.find((resource) =>
        resource.type.includes('liquidity_pool::LiquidityPool'),
      );

      if (liquidityPool?.data) {
        const token1Store = liquidityPool.data.token_store_1?.inner;
        const token2Store = liquidityPool.data.token_store_2?.inner;

        if (token1Store) {
          const token1Resources = await web3.eth.getResources(token1Store);
          const fungibleStore1 = token1Resources.find((resource) =>
            resource.type.includes('fungible_asset::FungibleStore'),
          );
          if (
            fungibleStore1?.data?.metadata?.inner &&
            fungibleStore1.data.balance !== '0'
          ) {
            formatter.merge(
              balances,
              fungibleStore1.data.metadata.inner,
              fungibleStore1.data.balance,
            );
          }
        }

        if (token2Store) {
          const token2Resources = await web3.eth.getResources(token2Store);
          const fungibleStore2 = token2Resources.find((resource) =>
            resource.type.includes('fungible_asset::FungibleStore'),
          );
          if (
            fungibleStore2?.data?.metadata?.inner &&
            fungibleStore2.data.balance !== '0'
          ) {
            formatter.merge(
              balances,
              fungibleStore2.data.metadata.inner,
              fungibleStore2.data.balance,
            );
          }
        }
      }
    }
  } catch (error) {
    console.log('Error fetching fungible asset balances:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
