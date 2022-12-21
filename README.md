## DappRadar DeFi Providers

[DappRadar](https://dappradar.com/)

## Installation

```bash
$ npm install
$ npm run build
$ npm run dev
```

## Adding Provider

You can find the necessary generic functions with their definitions in the util file.

Pull request convention

```bash
[CHAIN] [PROVIDER] integration
```

## Testing

After adding the new provider, you can test it with [Bloomrpc](https://github.com/bloomrpc/bloomrpc) or [integration testing](https://github.com/dappradar/dappradar-defi-providers/blob/master/src/factory/factory.spec.ts).

## Environment configuration

Create a copy of environment configuration

```bash
$ cp .env.sample .env
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

## License
All code committed to this repository belongs to DappRadar Lithuania.
