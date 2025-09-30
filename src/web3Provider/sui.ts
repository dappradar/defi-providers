import { Injectable } from '@nestjs/common';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

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
}
