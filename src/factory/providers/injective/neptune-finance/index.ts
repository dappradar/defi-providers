import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const MARKET_ADDRESS = 'inj1nc7gjkf2mhp34a6gquhurg8qahnw5kxs5u3s4u';
const CW20_TOKEN_ADDRESSES = [
  'inj18luqttqyckgpddndh8hvaq25d5nfwjc78m56lc',
  'inj1rmzufd7h09sqfrre5dtvu5d09ta7c0t4jzkr2f',
  'inj1kehk5nvreklhylx22p3x0yjydfsz9fv3fvg5xt',
  'inj1cy9hes20vww2yr6crvs75gxy5hpycya2hmjg9s',
  'inj1dafy7fv7qczzatd98dv8hekx6ssckrflswpjaz',
  'inj16jf4qkcarp3lan4wl2qkrelf4kduvvujwg0780',
  'inj1fzquxxxam59z6fzewy2hvvreeh3m04x83zg4vv',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  let balances = {};

  const marketBalances = await web3.eth.getAccountBalances(MARKET_ADDRESS);
  balances = formatter.sum([balances, marketBalances]);

  const marketCw20TokenBalances = await web3.eth.getAccountCw20TokenBalances(
    MARKET_ADDRESS,
    CW20_TOKEN_ADDRESSES,
  );
  balances = formatter.sum([balances, marketCw20TokenBalances]);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
