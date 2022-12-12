import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const mSolAddress = 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So';
const msolTokenAccount = '7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE';
const solTokenAccount = 'UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q';
const solAddress = 'So11111111111111111111111111111111111111112';

async function getTotalSupply(account, web3) {
  try {
    const tokenBalance = await web3.eth.call('getTokenSupply', [account]);
    return tokenBalance.value.amount;
  } catch {
    return 0;
  }
}

async function getTokenAccountBalance(account, web3) {
  try {
    const tokenBalance = await web3.eth.call('getTokenAccountBalance', [
      account,
    ]);
    return tokenBalance.value.amount;
  } catch {
    return 0;
  }
}

async function getSolBalance(account, web3) {
  try {
    const tokenBalance = await web3.eth.call('getBalance', [account]);
    return tokenBalance.value;
  } catch {
    return 0;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  const msolTotalSupply = await getTotalSupply(mSolAddress, web3);
  balances[mSolAddress] = BigNumber(msolTotalSupply);

  const mSolTokenAccountSupply = await getTokenAccountBalance(
    msolTokenAccount,
    web3,
  );
  balances[mSolAddress] = balances[mSolAddress].plus(mSolTokenAccountSupply);

  const solTokenAccountSupply = await getSolBalance(solTokenAccount, web3);
  balances[solAddress] = BigNumber(solTokenAccountSupply);

  for (const token in balances) {
    balances[token] = balances[token].toFixed();
  }
  return { balances };
}

export { tvl };
