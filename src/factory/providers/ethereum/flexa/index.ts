import ERC20_ABI from '../../../../constants/abi/erc20.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FLEXA_ADDRESS = '0x4a57e687b9126435a9b19e4a802113e266adebde'; // Flexa Contract
const STAKING_ADDRESS = '0x12f208476f64de6e6f933e55069ba9596d818e08'; // Flexa Staking

const AMP_ADDRESS = '0xff20817765cb7f73d4bde2e66e067e58d11095c2'; // Amp Contract
const MANAGER_ADDRESS = '0x706D7F8B3445D8Dfc790C524E3990ef014e7C578'; // Amp Collateral Manager

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  const balances = {};

  const results = await util.executeMultiCallsOfMultiTargets(
    [FLEXA_ADDRESS, AMP_ADDRESS],
    ERC20_ABI,
    'balanceOf',
    [[STAKING_ADDRESS], [MANAGER_ADDRESS]],
    block,
    chain,
    web3,
  );

  if (results[0] != '0') {
    balances[FLEXA_ADDRESS] = results[0];
  }
  if (results[1] != '0') {
    balances[AMP_ADDRESS] = results[1];
  }
  return { balances };
}

export { tvl };
