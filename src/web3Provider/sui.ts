import { Injectable } from '@nestjs/common';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import BigNumber from 'bignumber.js';
import formatter from '../util/formatter';

const nodeUrl = getFullnodeUrl('mainnet');

@Injectable()
export class Sui {
  private client: SuiClient;

  constructor() {
    this.client = new SuiClient({ url: nodeUrl });
  }

  async getObject(objectId) {
    const result = await this.client.getObject({
      id: objectId,
      options: {
        showType: true,
        showOwner: true,
        showContent: true,
      },
    });
    return (result.data.content as any).fields;
  }

  async getFullObject(objectId) {
    const result = await this.client.getObject({
      id: objectId,
      options: {
        showType: true,
        showOwner: true,
        showContent: true,
      },
    });
    return result.data;
  }

  async getDynamicFieldObject(parent, id, { idType = 'u64' } = {}) {
    const result = await this.client.getDynamicFieldObject({
      parentId: parent,
      name: {
        type: idType,
        value: id,
      },
    });
    return (result.data.content as any).fields;
  }

  async queryEvents({ eventType, transform = (i) => i }) {
    let filter: any = {};
    if (eventType) {
      filter = { MoveEventType: eventType };
    }

    const items = [];
    let cursor = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const result = await this.client.queryEvents({
        query: filter,
        cursor,
        limit: 50,
        order: 'ascending',
      });

      items.push(...result.data);
      cursor = result.nextCursor;
      hasNextPage = result.hasNextPage;
    }

    return items.map((i) => i.parsedJson).map(transform);
  }

  async getDynamicFieldObjects({ parent, cursor = null, limit = 50 }) {
    const items = [];
    let nextCursor = cursor;
    let hasNextPage = true;

    while (hasNextPage) {
      const result = await this.client.getDynamicFields({
        parentId: parent,
        cursor: nextCursor,
        limit,
      });

      const objectIds = result.data.map((field) => field.objectId);
      const objects = await this.getObjects(objectIds);
      items.push(...objects.map((obj) => obj.fields));

      nextCursor = result.nextCursor;
      hasNextPage = result.hasNextPage;
    }

    return items;
  }

  async devInspectTransactionBlock(sender: string, txBytes: string) {
    return await this.client.devInspectTransactionBlock({
      sender,
      transactionBlock: txBytes,
    });
  }

  async getCoinMetadata(coinType: string) {
    return await this.client.getCoinMetadata({ coinType });
  }

  async getObjects(objectIds) {
    if (objectIds.length === 0) return [];

    const BATCH_SIZE = 50;
    const objects = [];

    // Process in batches to respect the limit
    for (let i = 0; i < objectIds.length; i += BATCH_SIZE) {
      const batch = objectIds.slice(i, i + BATCH_SIZE);

      try {
        const results = await this.client.multiGetObjects({
          ids: batch,
          options: {
            showType: true,
            showOwner: true,
            showContent: true,
          },
        });

        // Process results and filter out errors
        results.forEach((result) => {
          if (result.data && result.data.content) {
            objects.push({
              type: result.data.type,
              fields: (result.data.content as any).fields,
            });
          }
        });
      } catch (error) {
        // Fallback to individual calls for this batch if multiGet fails
        for (const objectId of batch) {
          try {
            const result = await this.client.getObject({
              id: objectId,
              options: {
                showType: true,
                showOwner: true,
                showContent: true,
              },
            });
            if (result.data && result.data.content) {
              objects.push({
                type: result.data.type,
                fields: (result.data.content as any).fields,
              });
            }
          } catch (error) {
            continue;
          }
        }
      }
    }

    return objects;
  }

  // Helper function for tick to price conversion
  tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick);
  }

  // Helper function to calculate UniV3-like position balances
  addUniV3LikePosition(
    balances: { [key: string]: string },
    token0: string,
    token1: string,
    liquidity: string,
    tickLower: number,
    tickUpper: number,
    tick: number,
  ): void {
    const sa = this.tickToPrice(tickLower / 2);
    const sb = this.tickToPrice(tickUpper / 2);
    const liquidityBN = new BigNumber(liquidity);

    let amount0BN = new BigNumber(0);
    let amount1BN = new BigNumber(0);

    if (tick < tickLower) {
      amount0BN = liquidityBN.multipliedBy(sb - sa).dividedBy(sa * sb);
    } else if (tick < tickUpper) {
      const price = this.tickToPrice(tick);
      const sp = Math.pow(price, 0.5);

      amount0BN = liquidityBN.multipliedBy(sb - sp).dividedBy(sp * sb);
      amount1BN = liquidityBN.multipliedBy(sp - sa);
    } else {
      amount1BN = liquidityBN.multipliedBy(sb - sa);
    }

    if (amount0BN.isGreaterThan(0)) {
      formatter.merge(balances, token0, amount0BN.integerValue().toString());
    }
    if (amount1BN.isGreaterThan(0)) {
      formatter.merge(balances, token1, amount1BN.integerValue().toString());
    }
  }

  async query({ target, contractId, typeArguments = [], sender }) {
    const [packageId, module, functionName] = target.split('::');

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${module}::${functionName}`,
      arguments: [tx.object(contractId)],
      typeArguments,
    });

    const result = await this.client.devInspectTransactionBlock({
      sender,
      transactionBlock: tx,
    });

    if (result?.effects?.status?.status !== 'success') {
      throw new Error(`Move call failed: ${JSON.stringify(result, null, 2)}`);
    }

    return result.results?.[0]?.returnValues?.map((rv: any) => rv[0]) || [];
  }
}
