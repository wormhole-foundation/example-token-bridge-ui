# Example Token Bridge UI &middot; [![GitHub license](https://img.shields.io/badge/license-Apache2.0-blue.svg)](https://github.com/wormhole-foundation/example-token-bridge-ui/blob/main/LICENSE) ![Build](https://github.com/wormhole-foundation/example-token-bridge-ui/actions/workflows/build.yaml/badge.svg)

This app serves as a testnet and local devnet UI for the example token bridge contracts.

View at https://wormhole-foundation.github.io/example-token-bridge-ui/

## Install

```bash
npm ci
```

## Develop

If using the node version specified in `.nvmrc`, run with

```bash
npm start
```

If on latest LTS (v18.16.0), run with

```bash
NODE_OPTIONS=--openssl-legacy-provider npm start
```

*Note: the above issue should be resolved after updating to the latest mui + react versions*

## Build

```bash
npm run build
```

## Bridge a token between Solana Devnet and Base Sepolia
| Addresses and transactions                                                                               |
| -------------------------------------------------------------------------------------------------------- |
| [Token on Solana](https://explorer.solana.com/address/3YRpKTv3TQpeVVJYWR93aMYEenhaGiiQTAJ994di8GBK?cluster=devnet)
| [Token on Base](https://sepolia.basescan.org/token/0x0e61CE7002BD8361d8699332311c294592af4242)
| [Mapping on Solana](https://explorer.solana.com/tx/57azSLo4G722gPPCbYsx6qXDhJh8DChE9WNPdkFncmJqtCgm2o1ZKZeyE2n9V6FGavqZUrFqFHAbfueqdUbYQw4z?cluster=devnet)
| [Mapping on Base](hhttps://sepolia.basescan.org/tx/0x3e9297483674deb9f71d592671919f5c6a1d347464c3e2a9ca67a6ab7b8c77bd)
