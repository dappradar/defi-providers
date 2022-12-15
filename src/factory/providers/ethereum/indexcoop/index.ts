import TOKEN_ABI from './abi.json';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const TOKENS = [
  '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b', // DPI
  '0xaa6e8127831c9de45ae56bb1b0d4d4da6e5665bd', // FLI
  '0x72e364f2abdc788b7e918bc238b21f109cd634d7', // MVI
  '0xada0a1202462085999652dc5310a7a9e2bf3ed42', // CGI
  '0x0b498ff89709d3838a063f1dfa463091f9801c2b', // BTCFLI
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 10830516) {
    return {};
  }

  const components = await util.executeCallOfMultiTargets(
    TOKENS,
    TOKEN_ABI,
    'getComponents',
    [],
    block,
    chain,
    web3,
  );

  let targetList = [];
  let componentList = [];
  TOKENS.forEach((token, index) => {
    targetList = targetList.concat(components[index].map((compnent) => token));
    componentList = componentList.concat(components[index]);
  });

  const balanceResults = await util.getTokenBalancesOfHolders(
    targetList,
    componentList,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
