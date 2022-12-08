import beefyfinance from '../../../../util/calculators/beefyfinance';

const START_BLOCK = 380863;

async function tvl(params) {
  const { block, chain, provider } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await beefyfinance.getTvl(block, chain, provider);

  return { balances };
}

module.exports = {
  tvl,
};
