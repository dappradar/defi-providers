import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const ASSETS = [
  '0xDD629E5241CbC5919847783e6C96B2De4754e438',
  '0x2a8c22E3b10036f3AEF5875d04f8441d4188b656',
  '0x007115416AB6c266329a03B09a8aa39aC2eF7d9d',
  '0xbB51E2a15A9158EBE2b0Ceb8678511e063AB7a55',
  '0x030b69280892c888670EDCDCD8B69Fd8026A0BF3',
  '0x87C9053C819bB28e0D73d33059E1b3DA80AFb0cf',
];
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  const balances = {};

  const totalSupplies = await util.getTokenTotalSupplies(
    ASSETS,
    block,
    chain,
    web3,
  );

  totalSupplies.forEach((token) => {
    if (token && token.totalSupply.isGreaterThan(0)) {
      balances[token.token] = token.totalSupply.toFixed();
    }
  });

  return { balances };
}

export { tvl };
