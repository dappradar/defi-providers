import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const REN_TOKENS = {
  '0xc3fed6eb39178a541d274e6fc748d48f0ca01cc3': {
    coingecko: 'coingecko_bitcoin-cash',
    decimals: 8,
  },
  '0xdbf31df14b66535af65aac99c32e9ea844e14501': {
    coingecko: 'coingecko_renbtc',
    decimals: 8,
  },
  '0x2628568509e87c4429fbb5c664ed11391be1bd29': {
    coingecko: 'coingecko_dgb',
    decimals: 8,
  },
  '0xce829a89d4a55a63418bcc43f00145adef0edb8e': {
    coingecko: 'coingecko_dogecoin',
    decimals: 8,
  },
  '0xc4ace9278e7e01755b670c0838c3106367639962': {
    coingecko: 'coingecko_filecoin',
    decimals: 18,
  },
  '0x7c7daaf2db46fefd067f002a69fd0be14aeb159f': {
    coingecko: 'coingecko_terra',
    decimals: 6,
  },
  '0x31a0d1a199631d244761eeba67e8501296d2e383': {
    coingecko: 'coingecko_renzec',
    decimals: 8,
  },
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  if (block < 7502280) {
    return {};
  }

  const totalSupplies = await util.getTokenTotalSupplies(
    Object.keys(REN_TOKENS),
    block,
    chain,
    web3,
  );

  const balances = {};

  totalSupplies.forEach((data) => {
    if (data) {
      balances[REN_TOKENS[data.token].coingecko] = data.totalSupply
        .div(10 ** REN_TOKENS[data.token].decimals)
        .toFixed();
    }
  });

  return { balances };
}

export { tvl };
