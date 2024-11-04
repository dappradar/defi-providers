import { Injectable } from '@nestjs/common';
import axios from 'axios';
import Bottleneck from 'bottleneck';
import { nodeUrls } from '../app.config';

const url = nodeUrls.INJECTIVE_NODE_URL;

const limiter = new Bottleneck({
  minTime: 1000, // 1 request per second
});

@Injectable()
export class Injective {
  async call(address: string, method, params = {}): Promise<any> {
    let data = {
      [method]: params,
    };

    data = Buffer.from(JSON.stringify(data)).toString('base64');

    const response = await limiter
      .schedule(() =>
        axios.get(`${url}/cosmwasm/wasm/v1/contract/${address}/smart/${data}`),
      )
      .then((response) => response.data.data);

    return response[method];
  }

  async getAccountBalances(
    address: string,
  ): Promise<{ [key: string]: string }> {
    const balances = {};

    const response = await axios
      .get(`${url}/cosmos/bank/v1beta1/balances/${address}`)
      .then((response) => response.data);
    for (const balance of response.balances) {
      balances[balance.denom] = balance.amount;
    }

    return balances;
  }

  async getAccountCw20TokenBalances(
    address: string,
    cw20TokenAddresses: string[],
  ): Promise<{ [key: string]: string }> {
    const balances = {};

    await Promise.all(
      cw20TokenAddresses.map(async (token) => {
        balances[token] = await this.call(token, 'balance', { address });
      }),
    );

    return balances;
  }
}
