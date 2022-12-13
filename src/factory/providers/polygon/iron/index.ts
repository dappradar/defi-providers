import BigNumber from 'bignumber.js';
import POOL_ABI from './abi/abi.json';
import TREASURY_ABI from './abi/treasury.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const POOL_ADDRESS = '0x837503e8a8753ae17fb8c8151b8e6f586defcb57';
const TREASURY_ADDRESS = '0x376b9e0Abbde0cA068DeFCD8919CA73369124825';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 15065736) {
    return {};
  }
  const balances = {};

  try {
    const contract = new web3.eth.Contract(POOL_ABI, POOL_ADDRESS);
    const [tokens, tokenBalances] = await Promise.all([
      contract.methods.getTokens().call(null, block),
      contract.methods.getTokenBalances().call(null, block),
    ]);
    tokens.forEach((token, index) => {
      balances[token.toLowerCase()] = BigNumber(tokenBalances[index]);
    });
  } catch {}

  try {
    const treasuryContract = new web3.eth.Contract(
      TREASURY_ABI,
      TREASURY_ADDRESS,
    );
    const [token, balance] = await Promise.all([
      treasuryContract.methods.collateral().call(null, block),
      treasuryContract.methods.globalCollateralBalance().call(null, block),
    ]);
    formatter.sumMultiBalanceOf(balances, [
      {
        token: token.toLowerCase(),
        balance: BigNumber(balance),
      },
    ]);
  } catch {}

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
