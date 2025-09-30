import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const AFLUENT_POOLS_API = 'https://api.factorial.finance/info/pools';
const METHOD = 'get_pool_data';
const FACTORIAL_TON_ADDRESS =
  'EQDIKEz2BYLnTRWo5W5a6moZ9PXNtyOVOFF7noi8Ufv3axz_';

class BitReader {
  buffer: Buffer;
  byteOffset: number;
  bitOffset: number;

  constructor(buffer: Buffer, startByte = 0, startBit = 0) {
    this.buffer = buffer;
    this.byteOffset = startByte;
    this.bitOffset = startBit;
  }

  readBits(n: number): number {
    let value = 0;

    for (let i = 0; i < n; i++) {
      if (this.byteOffset >= this.buffer.length) {
        throw new Error('Buffer overflow while reading bits');
      }

      let bit = (this.buffer[this.byteOffset] >> (7 - this.bitOffset)) & 1;
      value = (value << 1) | bit;

      this.bitOffset++;
      if (this.bitOffset === 8) {
        this.bitOffset = 0;
        this.byteOffset++;
      }
    }
    return value;
  }

  readBytes(n: number): Buffer {
    let bytes = Buffer.alloc(n);
    for (let i = 0; i < n; i++) {
      bytes[i] = this.readBits(8);
    }
    return bytes;
  }
}

function decodeBase64(base64String: string): Buffer {
  return Buffer.from(base64String, 'base64');
}

function parseBoc(buffer: Buffer) {
  if (buffer.length < 4) {
    throw new Error('Buffer is too short to contain magic bytes');
  }

  const magic = buffer.readUInt32BE(0);
  if (magic !== 0xb5ee9c72) {
    throw new Error('Invalid magic');
  }

  let offset = 4;

  let hasIdx = (buffer[offset] >> 7) & 1;
  let hasCrc32c = (buffer[offset] >> 6) & 1;
  let hasCacheBits = (buffer[offset] >> 5) & 1;
  let flags = (buffer[offset] >> 3) & 0b11;
  let size = buffer[offset] & 0b111;
  offset++;

  let offBytes = buffer.readUInt8(offset);
  offset++;

  let cells = buffer.readUIntBE(offset, size);
  offset += size;

  let roots = buffer.readUIntBE(offset, size);
  offset += size;

  let absent = buffer.readUIntBE(offset, size);
  offset += size;

  let totalCellSize = buffer.readUIntBE(offset, offBytes);
  offset += offBytes;

  let root = [];
  for (let i = 0; i < roots; i++) {
    root.push(buffer.readUIntBE(offset, size));
    offset += size;
  }

  let index = null;
  if (hasIdx) {
    index = buffer.slice(offset, offset + cells * offBytes);
    offset += cells * offBytes;
  }

  let cellData = buffer.slice(offset, offset + totalCellSize);
  offset += totalCellSize;

  return { offset, root, index, cellData };
}

function parseAddress(buffer: Buffer, offset: number) {
  const wcByteOffset = 13;
  const wcBitsOffset = 3;
  let reader = new BitReader(buffer, wcByteOffset, wcBitsOffset);

  let wc = (reader.readBits(5) << 3) | reader.readBits(3);
  let addressHash = reader.readBytes(32);

  return { wc, addressHash, offset: reader.byteOffset };
}

function computeCRC16(buffer: Uint8Array): number {
  let crc = 0x0000;
  let polynomial = 0x1021;

  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i] << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
    crc &= 0xffff;
  }
  return crc;
}

function serializeAddress(wc: number, addressHash: Buffer): string {
  const bounceableTag = 0x11;
  let fullAddress = Buffer.alloc(36);
  fullAddress[0] = bounceableTag;
  fullAddress[1] = wc;
  fullAddress.set(addressHash, 2);

  let crc16 = computeCRC16(new Uint8Array(fullAddress.slice(0, 34)));
  fullAddress.writeUInt16BE(crc16, 34);

  return fullAddress.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

function processTVMSliceReadAddress(base64String: string): string {
  try {
    let buffer = decodeBase64(base64String);
    let { offset, root, index, cellData } = parseBoc(buffer);
    let { wc, addressHash } = parseAddress(buffer, offset);
    return serializeAddress(wc, addressHash);
  } catch (error) {
    return 'ton';
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { chain, provider, web3 } = params;

  let balances: Record<string, string> = {};
  let poolAddresses: string[] = [];

  try {
    const response = (await axios.get(AFLUENT_POOLS_API)).data;
    if (Array.isArray(response)) {
      poolAddresses = response
        .filter((p) => p && p.address)
        .map((p) => p.address);
    } else if (response && Array.isArray(response.pools)) {
      poolAddresses = response.pools
        .filter((p) => p && p.address)
        .map((p) => p.address);
    }

    await basicUtil.saveIntoCache(
      { addresses: poolAddresses, raw: response },
      'affluent-pools.json',
      chain,
      provider,
    );
  } catch {
    try {
      const cache = await basicUtil.readFromCache(
        'affluent-pools.json',
        chain,
        provider,
      );
      if (cache) {
        if (Array.isArray(cache.addresses)) {
          poolAddresses = cache.addresses;
        } else if (cache.raw) {
          const raw = cache.raw;
          if (Array.isArray(raw)) {
            poolAddresses = raw
              .filter((p) => p && p.address)
              .map((p) => p.address);
          } else if (raw && Array.isArray(raw.pools)) {
            poolAddresses = raw.pools
              .filter((p) => p && p.address)
              .map((p) => p.address);
          }
        }
      }
    } catch {}
  }

  if (!poolAddresses || poolAddresses.length === 0) {
    formatter.convertBalancesToFixed(balances);
    return { balances };
  }

  for (const pool of poolAddresses) {
    try {
      const poolData = await web3.eth.call(pool, METHOD);

      const _kv = 1;
      const assetDicIdx = 13;
      const supplyAmountIdx = 4;
      const borrowAmountIdx = 5;
      const addressIdx = 15;

      const assets = poolData[assetDicIdx][_kv]['elements'];

      assets.forEach((asset) => {
        const assetInfo = asset['tuple']['elements'];
        const supplied = BigInt(assetInfo[supplyAmountIdx]['number']['number']);
        const borrowed = BigInt(assetInfo[borrowAmountIdx]['number']['number']);
        const address = assetInfo[addressIdx]['slice']['bytes'];

        const assetAddress = processTVMSliceReadAddress(address);
        const addressToAdd =
          assetAddress === FACTORIAL_TON_ADDRESS ? 'ton' : assetAddress;

        const netAmount = supplied - borrowed;

        if (netAmount > 0n) {
          if (balances[addressToAdd]) {
            balances[addressToAdd] = (
              BigInt(balances[addressToAdd]) + netAmount
            ).toString();
          } else {
            balances[addressToAdd] = netAmount.toString();
          }
        }
      });
    } catch (error) {
      console.log(`Error calling ${METHOD} on pool ${pool}:`, error);
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
