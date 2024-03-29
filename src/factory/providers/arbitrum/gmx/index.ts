import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import VAULT_ABI from './abi/vault.json';

const VAULT = '0x489ee077994B6658eAfA855C308275EAd8097C4A';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const tokenLength = await util.executeCall(
    VAULT,
    VAULT_ABI,
    'allWhitelistedTokensLength',
    [],
    block,
    chain,
    web3,
  );
  const promises = [];
  for (let i = 0; i < tokenLength; i++) {
    promises.push(
      util.executeCall(
        VAULT,
        VAULT_ABI,
        'allWhitelistedTokens',
        [i],
        block,
        chain,
        web3,
      ),
    );
  }
  const tokens = await Promise.all(promises);

  const tokenBalances = await util.getTokenBalances(
    VAULT,
    tokens,
    block,
    chain,
    web3,
  );
  const balances = {};
  tokenBalances.forEach((tokenBalance) => {
    balances[tokenBalance.token.toLowerCase()] = BigNumber(
      tokenBalance.balance,
    ).toFixed();
  });

  return { balances };
}

export { tvl };
