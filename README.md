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
