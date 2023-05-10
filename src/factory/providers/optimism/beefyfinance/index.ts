import BigNumber from 'bignumber.js';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';
import beefyfinance from '../../../../util/calculators/beefyfinance';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 13140000;
const E_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const TOKEN_CONVERT = {
  '0xdecc0c09c3b5f6e92ef4184125d5648a66e35298':
    '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
  '0xd22363e3762ca7339569f3d33eade20127d5f98c':
    '0xe405de8f52ba7559f9df3c368500b6e6ae6cee49',
  '0x6ca558bd3eab53da1b25ab97916dd14bf6cfee4e':
    '0xe405de8f52ba7559f9df3c368500b6e6ae6cee49',
  '0x09448876068907827ec15f49a8f1a58c70b04d45':
    '0xe405de8f52ba7559f9df3c368500b6e6ae6cee49',
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = await beefyfinance.getTvl(block, chain, provider, web3);

  if (balances[E_ADDRESS]) {
    balances[WMAIN_ADDRESS.optimism] = BigNumber(
      balances[WMAIN_ADDRESS.optimism] || 0,
    )
      .plus(balances[E_ADDRESS])
      .toFixed();
    delete balances[E_ADDRESS];
  }
  for (const token in TOKEN_CONVERT) {
    if (balances[token]) {
      balances[TOKEN_CONVERT[token]] = BigNumber(
        balances[TOKEN_CONVERT[token]] || 0,
      )
        .plus(balances[token])
        .toFixed();
      delete balances[token];
    }
  }
  return { balances };
}
export { tvl };
