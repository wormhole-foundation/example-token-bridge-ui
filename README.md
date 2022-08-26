# Example Token Bridge UI &middot; [![GitHub license](https://img.shields.io/badge/license-Apache2.0-blue.svg)](https://github.com/wormhole-foundation/example-token-bridge-ui/blob/main/LICENSE) ![Build](https://github.com/wormhole-foundation/example-token-bridge-ui/actions/workflows/build.yaml/badge.svg)

This app serves as a testnet and local devnet UI for the example token bridge contracts. 

View at https://wormhole-foundation.github.io/example-token-bridge-ui/

## Install

```bash
npm ci
```

## Develop

```bash
npm start
```

## Build for local tilt network

```bash
npm run build
```

## Build for testnet

```bash
REACT_APP_CLUSTER=testnet npm run build
```
