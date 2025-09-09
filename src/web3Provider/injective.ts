import { Injectable } from '@nestjs/common';
import axios from 'axios';
import Bottleneck from 'bottleneck';
import { nodeUrls } from '../app.config';

const url = nodeUrls.INJECTIVE_NODE_URL;

const limiter = new Bottleneck({
  minTime: 100, // 10 request per second
});

// Multiple endpoints to try
const multipleEndpoints = [
  'https://injective-rest.publicnode.com',
  'https://injective-api.polkachu.com',
  'https://injective-rest.brocha.in',
  'https://injective-api.lavenderfive.com',
];

@Injectable()
export class Injective {
  async call(address: string, method, params = {}): Promise<any> {
    let data = {
      [method]: params,
    };
    data = Buffer.from(JSON.stringify(data)).toString('base64');

    // Try each endpoint
    for (
      let endpointIndex = 0;
      endpointIndex < multipleEndpoints.length;
      endpointIndex++
    ) {
      const endpoint = multipleEndpoints[endpointIndex];

      try {
        if (endpointIndex > 0) {
          console.log(
            `Trying endpoint ${endpointIndex + 1}/${
              multipleEndpoints.length
            }: ${endpoint}`,
          );
        }

        const response = await limiter
          .schedule(() =>
            axios.get(
              `${endpoint}/cosmwasm/wasm/v1/contract/${address}/smart/${data}`,
            ),
          )
          .then((response) => response.data.data);

        if (endpointIndex > 0) {
          console.log(
            `Success with endpoint ${endpointIndex + 1}: ${endpoint}`,
          );
        }
        return response;
      } catch (error) {
        console.log(
          `Endpoint ${endpointIndex + 1}/${
            multipleEndpoints.length
          } (${endpoint}) failed for ${address}: ${error.message}`,
        );

        if (endpointIndex >= multipleEndpoints.length - 1) {
          console.log(
            `All ${multipleEndpoints.length} endpoints failed for ${address}`,
          );
          throw error;
        }
      }
    }
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
        balances[token] = await this.call(token, 'balance', { address }).then(
          (response) => response['balance'],
        );
      }),
    );

    return balances;
  }
}
