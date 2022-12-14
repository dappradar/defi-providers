import ERC20_ABI from '../../../../constants/abi/erc20.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKENS = [
  '0x0db6729c03c85b0708166ca92801bcb5cac781fc', // veSOLAR
  '0xd2666441443daa61492ffe0f37717578714a4521', // gOHM
  '0xdd47a348ab60c61ad6b60ca8c31ea5e00ebfab4f', // synFRAX
  '0x1d4c2a246311bb9f827f4c768e277ff5787b7d7e', // MOVR
  '0xa1f8890e39b4d8e33efe296d698fe42fb5e59cc3', // AVAX
  '0x5cf84397944b9554a278870b510e86667681ff8d', // UST
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 175168) {
    return {};
  }

  const balances = {};

  const results = await util.executeCallOfMultiTargets(
    TOKENS,
    ERC20_ABI,
    'totalSupply',
    [],
    block,
    chain,
    web3,
  );

  results.forEach((balance, index) => {
    if (balance) {
      balances[TOKENS[index]] = balance;
    }
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
