import { Injectable } from '@nestjs/common';
import axios from 'axios';

const ton_center_api_url = 'https://toncenter.com/api';
const ton_center_api_headers = {
  headers: {
    'X-API-Key': process.env.TONCENTER_API_KEY,
  },
};
const ton_api_url = 'https://tonapi.io';

@Injectable()
export class Ton {
  async call(address, method, params = []) {
    const requestBody = {
      address,
      method,
      stack: params,
    };

    const response = await axios
      .post(
        `${ton_center_api_url}/v2/runGetMethod`,
        requestBody,
        ton_center_api_headers,
      )
      .then((response) => response.data.result);

    const { exit_code, stack } = response;
    if (exit_code !== 0) {
      throw new Error('Expected a zero exit code, but got ' + exit_code);
    }
    stack.forEach((i, idx) => {
      if (i[0] === 'num') {
        stack[idx] = parseInt(i[1], 16);
      }
    });

    return stack;
  }

  async getAccountBalances(address) {
    const balances = {};

    let response = await axios
      .get(`${ton_api_url}/v2/accounts/${address}/jettons?currencies=usd`)
      .then((response) => response.data);

    for (const balance of response.balances) {
      const packedAddress = await axios
        .get(
          `${ton_center_api_url}/v2/packAddress?address=${balance.jetton.address}`,
          ton_center_api_headers,
        )
        .then((response) => response.data.result);
      balances[packedAddress] = balance.balance;
    }

    response = await axios
      .get(`${ton_center_api_url}/v3/account?address=${address}`)
      .then((response) => response.data);
    balances['ton'] = response.balance;

    return balances;
  }
}
