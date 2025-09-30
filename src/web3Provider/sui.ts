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

      for (const field of result.data) {
        try {
          const obj = await this.client.getObject({
            id: field.objectId,
            options: {
              showType: true,
              showOwner: true,
              showContent: true,
            },
          });
          items.push(obj.data.content);
        } catch (error) {
          continue;
        }
      }
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
}
