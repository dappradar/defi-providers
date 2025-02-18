import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 16681417;
const STAKING_ADDRESSES = [
  '0x34fDA56b5c9Aa52DF9fa51b01666683b7b1434d6',
  '0xC0496C7B9D7150A81bD6fF1d015e95668BD4abeD',
  '0x92Ec27935cE7b523cc70C2fFaf0728F1Fa6425dF',
  '0x1BdFAa7aFAa454F491b5de40d24d681F0F3Adb1A',
  '0xB87A16fD301b3CFed03982D99840970328d185aD', // single
  '0xf7EaeceBd69430b31E711df8BD9DD215a49B6d80', // lp
  '0x742AB08EEc9f940beF657394720090F163f535Cc', // single
];
const TOKEN_ADDRESSES = [
  '0xA849EaaE994fb86Afa73382e9Bd88c2B6b18Dc71',
  '0x3c8ad34155b83ddb7f43119a19503d34ed2b5c7a',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const proxyBalance = await util.getTokenBalancesOfEachHolder(
    STAKING_ADDRESSES,
    TOKEN_ADDRESSES,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, proxyBalance);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
