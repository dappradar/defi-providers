import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CONTRACT_ADDRESS =
  '0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const res = await web3.eth.getResource(
      '0x7f83b020b8ab60dbdc4208029fa6aa0804bf5a71eeaca63382d24622b9e6f647',
      `${CONTRACT_ADDRESS}::pool::PoolConfigsMap`,
    );

    const poolConfigsMap = res.pool_configs_map.data;

    poolConfigsMap.forEach((item: any) => {
      const coin = item.key.startsWith('@')
        ? '0x' + item.key.slice(1)
        : item.key;
      const totalLend = item.value.total_lend;

      if (coin && totalLend && totalLend !== '0') {
        formatter.merge(balances, coin, totalLend);
      }
    });
  } catch (error) {
    console.log('Error fetching Joule Finance data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
