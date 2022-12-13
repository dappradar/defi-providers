import BigNumber from 'bignumber.js';
import CURVE_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const BASE_TOKENS = {
  '0x1a13f4ca1d028320a707d99520abfefca3998b7f':
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  '0x60d55f02a771d515e077c9c2403a1ef324885cec':
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  '0x27f8d03b3a2196956ed754badc28d73be8830a6e':
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
  '0x28424507fefb6f7f8e9d3860f56504e4e5f5f390':
    '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  '0x5c2ed810328349100a66b82b78a1791b101c9d61':
    '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
  '0x4e3decbb3645551b8a19f0ea1678079fcb33fb4c':
    '0xe0b52e49357fd4daf2c15e02058dce6bc0057db4',
  '0x750e4c4984a9e0f12978ea6742bc1c5d248f40ed':
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  '0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4':
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  '0x7bdf330f423ea880ff95fc41a280fd5ecfd3d09f':
    '0xe0b52e49357fd4daf2c15e02058dce6bc0057db4',
  '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171':
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
};

const CURVE_POOLS = {
  '0x751b1e21756bdbc307cbcc5085c042a0e9aaef36': [
    '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171',
    '0x5c2ed810328349100a66b82b78a1791b101c9d61',
    '0x28424507fefb6f7f8e9d3860f56504e4e5f5f390',
  ],
  '0x445fe580ef8d70ff569ab36e80c647af338db351': [
    '0x27f8d03b3a2196956ed754badc28d73be8830a6e',
    '0x1a13f4ca1d028320a707d99520abfefca3998b7f',
    '0x60d55f02a771d515e077c9c2403a1ef324885cec',
  ],
  '0xc2d95eef97ec6c17551d45e77b590dc1f9117c67': [
    '0x5c2ed810328349100a66b82b78a1791b101c9d61',
    '0xdbf31df14b66535af65aac99c32e9ea844e14501',
  ],
  '0x92215849c439e1f8612b6646060b4e3e5ef822cc': [
    '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171',
    '0x5c2ed810328349100a66b82b78a1791b101c9d61',
    '0x28424507fefb6f7f8e9d3860f56504e4e5f5f390',
  ],
  '0xb446bf7b8d6d4276d0c75ec0e3ee8dd7fe15783a': [
    '0x7bdf330f423ea880ff95fc41a280fd5ecfd3d09f',
    '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171',
  ],
  '0x447646e84498552e62ecf097cc305eabfff09308': [
    '0xa3fa99a148fa48d14ed51d610c367c61876997f1',
    '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171',
  ], // Factory
  '0xfba3b7bb043415035220b1c44fb4756434639392': [
    '0x750e4c4984a9e0f12978ea6742bc1c5d248f40ed',
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  ], //Factory
  '0x2ffbce9099cbed86984286a54e5932414af4b717': [
    '0xe0b52e49357fd4daf2c15e02058dce6bc0057db4',
    '0x4e3decbb3645551b8a19f0ea1678079fcb33fb4c',
  ], //Factory
  '0x5e5a23b52cb48f5e70271be83079ca5bc9c9e9ac': [
    '0x45c32fa6df82ead1e2ef74d17b76547eddfaff89',
    '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171',
  ], //Factory
  '0xadf577b69eeac9df325536cf1af106372f2da263': [
    '0x2e1ad108ff1d8c782fcbbb89aad783ac49586756',
    '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171',
  ], //Factory
  '0x5bca7ddf1bcccb2ee8e46c56bfc9d3cdc77262bc': [
    '0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4',
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  ], //Factory
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 13479484) {
    return {};
  }

  let tokenList = [];
  let idList = [];
  let poolList = [];
  Object.keys(CURVE_POOLS).forEach((pool) => {
    const tokens = CURVE_POOLS[pool].filter((token) => token);
    tokenList = tokenList.concat(tokens);
    idList = idList.concat(
      CURVE_POOLS[pool]
        .map((token, id) => (token ? id : -1))
        .filter((id) => id >= 0),
    );
    poolList = poolList.concat(tokens.map((token) => pool));
  });

  const results = await util.executeMultiCallsOfMultiTargets(
    poolList,
    CURVE_ABI,
    'balances',
    idList.map((id) => [id]),
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  tokenList.forEach((token, index) => {
    if (results[index]) {
      if (token == '0x7bdf330f423ea880ff95fc41a280fd5ecfd3d09f') {
        balanceResults.push({
          token: BASE_TOKENS[token] || token,
          balance: BigNumber(results[index]).times(1e12),
        });
      } else if (token == '0xe7a24ef0c5e95ffb0f6684b813a78f2a3ad7d171') {
        balanceResults.push({
          token: BASE_TOKENS[token] || token,
          balance: BigNumber(results[index]).div(1e12),
        });
      } else {
        balanceResults.push({
          token: BASE_TOKENS[token] || token,
          balance: BigNumber(results[index]),
        });
      }
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
