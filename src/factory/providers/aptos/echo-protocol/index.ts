import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

let _data: any;

async function getData(web3: any) {
  if (!_data) _data = _getData(web3);

  return _data;

  async function _getData(web3: any) {
    const resourcesResponse = await web3.eth.functionView({
      functionStr:
        '0xeab7ea4d635b6b6add79d5045c4a45d8148d88287b1cfa1c3b6a4b56f46839ed::pool_data_provider::get_all_reserves_tokens',
    });
    const resources = resourcesResponse[0];

    const [uTokens, tokens] = await web3.eth.functionView({
      functionStr:
        '0xeab7ea4d635b6b6add79d5045c4a45d8148d88287b1cfa1c3b6a4b56f46839ed::underlying_token_factory::get_coin_asset_pairs',
    });

    const tokenMapping: any = {};
    tokens.forEach(
      (token: string, i: number) => (tokenMapping[token] = uTokens[i]),
    );

    for (const item of resources) {
      const token = item.token_address;
      if (!token) {
        continue;
      }
      item.uToken = tokenMapping[token];
      if (!item.uToken) {
        continue;
      }
      item.reserve = await web3.eth.functionView({
        functionStr:
          '0xeab7ea4d635b6b6add79d5045c4a45d8148d88287b1cfa1c3b6a4b56f46839ed::pool_data_provider::get_reserve_data',
        args: [token],
      });
      item.debt = item.reserve[3];
      item.balance = +item.reserve[2] - +item.debt;
    }
    const filteredResources = resources.filter(
      (i: any) => i.uToken && i.token_address,
    );
    return filteredResources;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  try {
    const data = await getData(web3);
    data.forEach((item: any) => {
      if (item.uToken && item.balance > 0) {
        formatter.merge(balances, item.uToken, item.balance.toString());
      }
    });
  } catch (error) {
    console.log('Error fetching Echo Protocol data:', error);
  }

  formatter.mapAptosTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
