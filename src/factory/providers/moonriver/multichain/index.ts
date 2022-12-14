import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const MULTICHAIN_API = 'https://netapi.anyswap.net/bridge/v2/info';

async function fetchData(url) {
  const data = await fetch(url).then((res) => res.json());
  const protocolsInMoonriver = data.bridgeList.filter(
    (p) => p.chainId.toString() === '1285',
  );
  return protocolsInMoonriver;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 458449) {
    return {};
  }

  const data = await fetchData(MULTICHAIN_API);

  const tokens = data.map((protocol) => protocol.token);
  const results = await util.executeCallOfMultiTargets(
    tokens,
    ERC20_ABI,
    'totalSupply',
    [],
    block,
    chain,
    web3,
  );

  const balances = {};
  results.forEach((balance, index) => {
    if (balance) {
      balances[tokens[index]] = BigNumber(balance);
    }
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
