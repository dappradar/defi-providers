import { nodeUrls } from '../app.config';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import aptosToken from '../constants/tokens/aptos/core.json';
import { AptosClient } from 'aptos';
import formatter from '../util/formatter';

const nodeUrl = nodeUrls.APTOS_NODE_URL;

@Injectable()
export class Aptos {
  async query(api) {
    return axios.get(`${nodeUrl}${api}`);
  }

  async getResources(account) {
    const data = [];
    let lastData;
    let cursor;
    do {
      let url = `${nodeUrl}/accounts/${account}/resources?limit=9999`;
      if (cursor) url += '&start=' + cursor;
      const res = await axios.get(url);
      lastData = res.data;
      data.push(...lastData);
      console.log('fetched resource length', lastData.length);
      cursor = res.headers['x-aptos-cursor'];
    } while (lastData.length === 9999);
    return data;
  }

  async getResource(account, key) {
    const url = `${nodeUrl}/accounts/${account}/resource/${key}`;
    const { data } = (await axios.get(url)).data;
    return data;
  }

  async getCoinInfo(address) {
    if (address === '0x1') return { data: { decimals: 8, name: 'Aptos' } };
    const data = (
      await axios.get(
        `${nodeUrl}/accounts/${address}/resource/0x1::coin::CoinInfo%3C${address}::coin::T%3E`,
      )
    ).data;
    return data;
  }

  async getTableData({ table, data }) {
    const response = (await axios.post(`${nodeUrl}/tables/${table}/item`, data))
      .data;
    return response;
  }

  async functionView({ functionStr, type_arguments = [], args = [] }) {
    const response = (
      await axios.post(`${nodeUrl}/view`, {
        function: functionStr,
        type_arguments: type_arguments,
        arguments: args,
      })
    ).data;
    return response;
  }

  async dexExport({
    account,
    poolStr,
    token0Reserve = (i) => i.data.coin_x_reserve.value,
    token1Reserve = (i) => i.data.coin_y_reserve.value,
    getTokens = (i) => i.type.split('<')[1].replace('>', '').split(', '),
  }) {
    const aptosTokenValue = Object.values(aptosToken);
    const balances = {};
    let pools = await this.getResources(account);
    pools = pools.filter((i) => i.type.includes(poolStr));
    console.log(`Number of pools: ${pools.length}`);
    pools.forEach((i) => {
      const reserve0 = token0Reserve(i);
      const reserve1 = token1Reserve(i);
      const [token0, token1] = getTokens(i);
      const isCoreAsset0 = aptosTokenValue.includes(token0);
      const isCoreAsset1 = aptosTokenValue.includes(token1);
      const nonNeglibleReserves = reserve0 !== '0' && reserve1 !== '0';
      if (isCoreAsset0 && isCoreAsset1) {
        formatter.merge(balances, token0, reserve0);
        formatter.merge(balances, token1, reserve1);
      } else if (isCoreAsset0) {
        formatter.merge(balances, token0, reserve0);
        if (nonNeglibleReserves) formatter.merge(balances, token0, reserve0);
      } else if (isCoreAsset1) {
        formatter.merge(balances, token1, reserve1);
        if (nonNeglibleReserves) formatter.merge(balances, token1, reserve1);
      }
    });

    return balances;
  }

  async getBlockNumber() {
    const client = new AptosClient(nodeUrl);
    const ledgerInfo = await client.getLedgerInfo();
    return ledgerInfo.block_height;
  }

  async getBlock(blockNumber) {
    const client = new AptosClient(nodeUrl);
    const ledgerInfo = await client.getBlockByHeight(blockNumber);
    return {
      timestamp: ledgerInfo.block_timestamp,
      number: ledgerInfo.block_height,
    };
  }
}
