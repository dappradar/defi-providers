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
}
