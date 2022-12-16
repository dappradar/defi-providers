import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const ETH_BRIDGE_ADDRESS = '0x011B6E24FfB0B5f5fCc564cf4183C5BBBc96D515';
const GATEWAY_ADDRESS = '0xa3A7B6F88361F48403514059F1F16C8E78d60EeC';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
let TOKENS = [
  '0x0000a1c00009a619684135b824ba02f7fbf3a572',
  '0x0391d2021f89dc339f60fff84546ea23e337750f',
  '0x08d967bb0134f2d07f7cfb6e246680c53927dd30',
  '0x0a5e677a6a24b2f1a2bf4f3bffc443231d2fdec8',
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
  '0x126c121f99e1e211df2e5f8de2d96fa36647c855',
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  '0x21bfbda47a0b4b5b1248c767ee49f7caa9b23697',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
  '0x2ba592f78db6436527729929aaf6c908497cb200',
  '0x3472a5a71965499acd81997a54bba8d852c6e53d',
  '0x43044f861ec040db59a7e324c40507addb673142',
  '0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd',
  '0x4691937a7508860f876c9c0a2a617e7d9e945d4b',
  '0x4f9254c83eb525f9fcf346490bbb3ed28a81c667',
  '0x514910771af9ca656af840dff83e8264ecf986ca',
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
  '0x6399c842dd2be3de30bf99bc7d1bbf6fa3650e70',
  '0x65d9bc970aa9b2413027fa339f7f179b3f3f2604',
  '0x6810e776880c02933d47db1b9fc05908e5386b96',
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
  '0x73968b9a57c6e53d41345fd57a6e6ae27d6cdb2f',
  '0x86772b1409b61c639eaac9ba0acfbb6e238e5f83',
  '0x970b9bb2c0444f5e81e9d0efb84c8ccdcdcaf84d',
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  '0xa1d65e8fb6e87b60feccbc582f7f97804b725521',
  '0xa3bed4e1c75d00fa6f4e5e6922db7261b5e9acd2',
  '0xb986f3a2d91d3704dc974a24fb735dcc5e3c1e70',
  '0xba100000625a3754423978a60c9317c58a424e3d',
  '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
  '0xc00e94cb662c3520282e6f5717214004a7f26888',
  '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
  '0xca1207647ff814039530d7d35df0e1dd2e91fa84',
  '0xd291e7a03283640fdc51b121ac401383a46cc623',
  '0xd533a949740bb3306d119cc777fa900ba034cd52',
  '0xeda6efe5556e134ef52f2f858aa1e81c84cda84b',
  '0xedd7c94fd7b4971b916d15067bc454b9e1bad980',
  '0xf938424f7210f31df2aee3011291b658f872e91e',
  '0xfa6de2697d59e88ed7fc4dfe5a33dac43565ea41',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 12525700) {
    return {};
  }

  try {
    TOKENS = await fetch(
      `https://balance-api.dappradar.com/ethereum/balance/${GATEWAY_ADDRESS}`,
    )
      .then((res) => res.json())
      .then((res) => res.map((info) => info[0]));
  } catch {}

  const [results, ethBalance] = await Promise.all([
    util.executeCallOfMultiTargets(
      TOKENS,
      ERC20_ABI,
      'balanceOf',
      [GATEWAY_ADDRESS],
      block,
      chain,
      web3,
    ),
    web3.eth.getBalance(ETH_BRIDGE_ADDRESS, block),
  ]);

  const balances = {};
  results.forEach((result, index) => {
    const balance = BigNumber(result || 0);
    if (balance.isGreaterThan(0)) {
      balances[TOKENS[index].toLowerCase()] = balance.toFixed();
    }
  });

  const balance = BigNumber(ethBalance || 0);
  if (balance.isGreaterThan(0)) {
    balances[WETH_ADDRESS] = balance
      .plus(balances[WETH_ADDRESS] || 0)
      .toFixed();
  }

  return { balances };
}

export { tvl };
