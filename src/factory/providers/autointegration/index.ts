import { AbiItem } from 'web3-utils';
import uniswapV2 from './uniswapV2';
import formatter from '../../../util/formatter';
import BigNumber from 'bignumber.js';
import {
  ITvlAutointegrationParams,
  ITvlReturn,
} from '../../../interfaces/ITvl';
import FACTORY_ABI from '../../../constants/abi/factory.json';

const UNISWAP_V2 = 'uniswapV2';
const SUPPORTED_DAPP_TYPES = [UNISWAP_V2];

async function tvl(
  params: ITvlAutointegrationParams,
): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3, dappType, addresses } = params;

  if (!SUPPORTED_DAPP_TYPES.includes(dappType)) {
    console.log(`Dapp type ${dappType} is not supported`);
    return { balances: {} };
  }
  console.log(`Dapp identified as ${dappType} type`);

  if (dappType === UNISWAP_V2) {
    const result = { balances: {}, poolBalances: {} };

    for (const address of addresses.split(',')) {
      const contract = new web3.eth.Contract(FACTORY_ABI as AbiItem[], address);

      let usePoolMethodsFlg = false;
      try {
        await contract.methods.allPairsLength().call(null, block);
      } catch {
        usePoolMethodsFlg = true;
      }

      const { balances, poolBalances } = await uniswapV2.getTvl(
        address,
        block,
        chain,
        provider,
        web3,
        usePoolMethodsFlg,
      );

      for (const token in balances) {
        result.balances[token] = BigNumber(result.balances[token] || 0).plus(
          balances[token],
        );
      }
      Object.assign(result.poolBalances, poolBalances);
    }

    formatter.convertBalancesToFixed(result.balances);
    return result;
  }
}

export { tvl };
