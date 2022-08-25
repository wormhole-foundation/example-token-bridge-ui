# Example Token Bridge UI

## Prerequisites

- NodeJS v14+
- NPM v7.18+

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

## Test Server

```bash
npx serve -s build
```

## Environment Variables (optional)

Create `.env` from the sample file, then add your Covalent API key:

```bash
cp .env.sample .env
```
