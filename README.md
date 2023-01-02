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

## Environment configuration

Create a copy of environment configuration

```bash
$ cp .env.prod.sample .env.prod
```

Update the .env file according to the blockchain you want to work with and follow the installation steps.

```bash
ETHEREUM_NODE_URL=
BSC_NODE_URL=
AURORA_NODE_URL=
AVALANCHE_NODE_URL=
CELO_NODE_URL=
EVERSCALE_NODE_URL=
FANTOM_NODE_URL=
HEDERA_NODE_URL=
MOONBEAM_NODE_URL=
MOONRIVER_NODE_URL=
NEAR_NODE_URL=
OPTIMISM_NODE_URL=
POLYGON_NODE_URL=
RONIN_NODE_URL=
SOLANA_NODE_URL=
STACKS_NODE_URL=
TEZOS_NODE_URL=
```

## Integration examples

Uniswap V2 clone integration: [Sakeswap](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/ethereum/sakeswap)

Staking contract integrations: [RADAR](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/ethereum/radarstaking), [CityCoins](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/stacks/citycoins)

Integration based on subgraph: [Rubicon](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/optimism/rubicon)

Integration based on various smart contract methods calls: [Aave](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/avalanche/aave), [Iron](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/polygon/iron)

Integration where LP tokens are locked as TVL so their underlying balances have to be calculated: [Autofarm](https://github.com/dappradar/dappradar-defi-providers/tree/master/src/factory/providers/bsc/autofarm)

## Contact

Do not hesitate to contact us with any questions. Here is the [discord](https://discord.gg/fd44Kn9N)
