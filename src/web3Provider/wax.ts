import { nodeUrls } from '../app.config';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import fetch from 'node-fetch';

const nodeUrl = nodeUrls.WAX_NODE_URL;

@Injectable()
export class Wax {
  async getBlockNumber() {
    const url = `${nodeUrl}/v1/chain/get_block_info`;
    const block = await fetch(url).then((res) => res.json());
    return block.block_num;
  }

  async getBlock(blockNumber) {
    const blockInfo = (
      await axios.post(`${nodeUrl}/v1/chain/get_block`, {
        block_num_or_id: blockNumber,
      })
    ).data;
    return { timestamp: blockInfo.timestamp, number: blockInfo.block_num };
  }

  async getAccountBalances(account_name, chain = 'eos') {
    return (
      await axios.post(`${nodeUrl}/v1/chain/get_account`, { account_name })
    ).data;
  }

  async get_currency_balance(code, account, symbol, chain = 'eos') {
    const data = (
      await axios.post(`${nodeUrl}/v1/chain/get_currency_balance`, {
        code,
        account,
        symbol,
      })
    ).data;
    if (!data.length) return 0;
    return (
      Number(data[0].split(' ')[0]) * (code == 'eosio.token' ? 1 : 10 ** 4)
    );
  }

  get_precision(symbol) {
    if (symbol.includes(',')) return symbol.split(',')[0];
    if (symbol == 'WAX') return 8;
    return 4;
  }

  async get_staked(account_name, symbol, chain = 'eos') {
    const response = (
      await axios.post(`${nodeUrl}/v1/chain/get_account`, {
        account_name,
      })
    ).data;
    try {
      return response.voter_info.staked / 10 ** 4;
    } catch (e) {
      return 0;
    }
  }

  async get_account_tvl(accounts, tokens, chain = 'eos') {
    const balances = {};

    for (const account of Array.isArray(accounts) ? accounts : [accounts]) {
      for (const [code, symbol, id] of tokens) {
        const balance = await this.get_currency_balance(
          code,
          account,
          symbol,
          chain,
        );
        const staked =
          code == 'eosio.token'
            ? await this.get_staked(account, symbol, chain)
            : 0;

        if (balances[`${code}/${symbol}`])
          balances[`${code}/${symbol}`] += balance + staked;
        else balances[`${code}/${symbol}`] = balance + staked;
      }
    }
    return balances;
  }
}
