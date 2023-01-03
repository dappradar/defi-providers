## DappRadar DeFi Providers

[DappRadar](https://dappradar.com/)

## Preinstall

Installation [Protoc](http://google.github.io/proto-lens/installing-protoc.html)

#### Mac OS X

```bash
PROTOC_ZIP=protoc-3.14.0-osx-x86_64.zip
curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v3.14.0/$PROTOC_ZIP
sudo unzip -o $PROTOC_ZIP -d /usr/local bin/protoc
sudo unzip -o $PROTOC_ZIP -d /usr/local 'include/*'
rm -f $PROTOC_ZIP
```

#### Linux

```bash
PROTOC_ZIP=protoc-3.14.0-linux-x86_64.zip
curl -OL https://github.com/protocolbuffers/protobuf/releases/download/v3.14.0/$PROTOC_ZIP
sudo unzip -o $PROTOC_ZIP -d /usr/local bin/protoc
sudo unzip -o $PROTOC_ZIP -d /usr/local 'include/*'
rm -f $PROTOC_ZIP
```

## Installation

```bash
$ npm install
$ npm run build
$ npm run dev
```

## Adding New Provider

You can see all the chains and providers that have already been added in [providers](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers).

When adding a new provider, open a folder in that file and follow the convention in the integration examples below.

You can find the necessary generic functions with their definitions in the [util](https://github.com/dappradar/dappradar-defi-providers/blob/master/src/util/blockchainUtil.ts) or [calculators](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/util/calculators) file.

Pull request convention

```bash
[CHAIN] [PROVIDER] integration
```

By submitting the code, you transfer all the rights to the code to DappRadar UAB and retain no copyright or other intellectual property rights to it.

## Testing

After adding the new provider, you can test it with [Bloomrpc](https://github.com/bloomrpc/bloomrpc) or [integration testing](https://github.com/dappradar/dappradar-defi-providers/blob/master/src/factory/factory.spec.ts).

## Integration examples

Uniswap V2 clone integration: [Sakeswap](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/ethereum/sakeswap)

Staking contract integrations: [RADAR](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/ethereum/radarstaking), [CityCoins](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/stacks/citycoins)

Integration based on subgraph: [Rubicon](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/optimism/rubicon)

Integration based on various smart contract methods calls: [Aave](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/avalanche/aave), [Iron](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/polygon/iron)

Integration where LP tokens are locked as TVL so their underlying balances have to be calculated: [Autofarm](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/bsc/autofarm)

## Uniswap V2 clone integration code walk through

import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';

const START_BLOCK = 10932295;
const FACTORY_ADDRESS = '0x75e48C954594d64ef9613AeEF97Ad85370F13807';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
const { block, chain, provider, web3 } = params;
if (block < START_BLOCK) {
return {};
}

const { balances, poolBalances } = await uniswapV2.getTvl(
FACTORY_ADDRESS,
block,
chain,
provider,
web3,
);
formatter.convertBalancesToFixed(balances);
return { balances, poolBalances };
}

export { tvl };

## Contact

Do not hesitate to contact us with any questions. Here is the [discord](https://discord.com/channels/415573887531745281/1059466542162653284)
