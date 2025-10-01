import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';
import suiTokens from '../../../../constants/tokens/sui.json';

const XSUI_INFO_ID =
  '0x0431232199873db77a92aa645cd43521437e9cc5c6fff07fd03edb88afe0b25a';

async function loadInfo(
  web3: any,
): Promise<{ totalSupply: bigint; stakedSui: bigint }> {
  const obj = await web3.getObject(XSUI_INFO_ID);

  const totalSupply = BigInt(
    obj.lst_treasury_cap.fields.total_supply.fields.value,
  );
  const stakedSui = BigInt(obj.storage.fields.total_sui_supply);

  return { totalSupply, stakedSui };
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const { stakedSui } = await loadInfo(web3);
    formatter.merge(balances, suiTokens.SUI, stakedSui.toString());
  } catch (error) {
    log.error({
      message: error?.message || '',
      stack: error?.stack || '',
      detail: 'Error fetching xSUI TVL',
      endpoint: 'tvl',
    });
  }

  formatter.convertSuiBalancesToFixed(balances);
  return { balances };
}

export { tvl };
