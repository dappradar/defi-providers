import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const APTIN_ADDRESS =
  '0x719b1538162dae27f6d818b384dcf82f198b5c5a90b605d3c9aec1189013a73c';
const LEND_PROTOCOL_TYPE =
  '0x3c1d4a86594d681ff7e5d5a233965daeabdc6a15fe5672ceeda5260038857183::pool::LendProtocol';
const POOL_TYPE =
  '0x3c1d4a86594d681ff7e5d5a233965daeabdc6a15fe5672ceeda5260038857183::pool::Pool';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  try {
    const lendPool = await web3.eth.getResource(
      APTIN_ADDRESS,
      LEND_PROTOCOL_TYPE,
    );

    if (!lendPool || !lendPool.coins || !lendPool.pools?.handle) {
      console.log('Aptin: No lending pool data found');
      return { balances };
    }

    const coins = lendPool.coins;
    const tableHandle = lendPool.pools.handle;

    const poolDataPromises = coins.map(async (coin) => {
      try {
        const poolData = await web3.eth.getTableData({
          table: tableHandle,
          data: {
            key_type: '0x1::string::String',
            value_type: POOL_TYPE,
            key: coin,
          },
        });
        return { coin, poolData };
      } catch (error) {
        console.log(`Error fetching pool data for coin ${coin}:`, error);
        return null;
      }
    });

    const poolResults = await Promise.all(poolDataPromises);

    poolResults.forEach((result) => {
      if (!result || !result.poolData) return;

      const { coin, poolData } = result;

      const supplyValue = poolData.supply_pool?.total_value || '0';
      const borrowValue = poolData.borrow_pool?.total_value || '0';

      const tvlValue = BigInt(supplyValue) - BigInt(borrowValue);

      if (tvlValue > 0n) {
        formatter.merge(balances, coin, tvlValue.toString());
      }
    });
  } catch (error) {
    console.log('Error fetching Aptin data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
