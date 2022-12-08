import unitroller from '../../../../util/calculators/unitroller';
import formatter from '../../../../util/formatter';

const START_BLOCK = 60501454;
const UNITROLLER_ADDRESSES = ['0x817af6cfaf35bdc1a634d6cc94ee9e4c68369aeb'];

async function tvl(params) {
  const { block, chain, provider } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await unitroller.getTvl(
    UNITROLLER_ADDRESSES,
    block,
    chain,
    provider,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
