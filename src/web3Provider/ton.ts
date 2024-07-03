import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class Ton {
  async call(address, method, params = []) {
    const requestBody = {
      address,
      method,
      stack: params,
    };

    const response = await axios
      .post('https://toncenter.com/api/v2/runGetMethod', requestBody, {
        headers: {
          'X-API-Key': process.env.TONCENTER_API_KEY,
        },
      })
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
}
