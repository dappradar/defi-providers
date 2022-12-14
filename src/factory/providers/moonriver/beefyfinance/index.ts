import BigNumber from 'bignumber.js';
import beefyfinance from '../../../../util/calculators/beefyfinance';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 759936;
const TOKEN_CONVERT = {
  //USDC.m
  '0x748134b5f553f2bcbd78c6826de99a70274bdeb3':
    '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d',
  //BTC.m
  '0x78f811a431d248c1edcf6d95ec8551879b2897c3':
    '0x6ab6d61428fde76768d7b45d8bfeec19c6ef91a8',
  //USDT.m
  '0xe936caa7f6d9f5c9e907111fcaf7c351c184cda7':
    '0xb44a9b6905af7c801311e8f4e76932ee959c663c',
  //ETH.m
  '0x576fde3f61b7c97e381c94e7a03dbc2e08af1111':
    '0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c',
  //wstKSM
  '0x3bfd113ad0329a7994a681236323fb16e16790e3':
    '0xffffffff1fcacbd218edc0eba20fc2308c778080',
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = await beefyfinance.getTvl(block, chain, provider, web3);

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
