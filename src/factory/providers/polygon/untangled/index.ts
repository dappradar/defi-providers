import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import erc4626Abi from './abi.json';
import blockchainUtil from '../../../../util/blockchainUtil';

const VAULT_ADDRESS = '0x3f48e00CFEba3e713dB8Bc3E28d634578c553e32';
const START_BLOCK = 67008821;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances: Record<string, string> = {};

  try {
    const assetTokenAddress = (await blockchainUtil.executeCall(
      VAULT_ADDRESS,
      erc4626Abi,
      'asset',
      [],
      block,
      chain,
      web3,
    )) as string;

    const totalAssetAmount = await blockchainUtil.executeCall(
      VAULT_ADDRESS,
      erc4626Abi,
      'totalAssets',
      [],
      block,
      chain,
      web3,
    );

    const balances = {
      [assetTokenAddress.toLowerCase()]: totalAssetAmount.toString(),
    };

    formatter.convertBalancesToFixed(balances);

    return { balances };
  } catch (error) {
    console.error(
      `Error calculating TVL for ERC4626 vault ${VAULT_ADDRESS} on chain ${chain} at block ${block}:`,
      error,
    );
    return { balances: {} };
  }
}

export { tvl };
