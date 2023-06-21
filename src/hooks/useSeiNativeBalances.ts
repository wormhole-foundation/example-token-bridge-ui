import { cosmos } from "@certusone/wormhole-sdk";
import { base58, formatUnits } from "ethers/lib/utils";
import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { NFTParsedTokenAccount } from "../store/nftSlice";
import { SEI_DECIMALS, SEI_TRANSLATOR } from "../utils/consts";
import { getSeiQueryClient, getSeiWasmClient } from "../utils/sei";

export default function useSeiNativeBalances(
  walletAddress?: string,
  refreshRef?: MutableRefObject<() => void>
) {
  const [isLoading, setIsLoading] = useState(true);
  const [balances, setBalances] = useState<
    NFTParsedTokenAccount[] | undefined
  >();
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = () => {
        setRefresh(true);
      };
    }
  }, [refreshRef]);
  useEffect(() => {
    setRefresh(false);
    if (walletAddress) {
      setIsLoading(true);
      setBalances(undefined);
      (async () => {
        try {
          const client = await getSeiQueryClient();
          const wasmClient = await getSeiWasmClient();
          // TODO: pagination?
          const response = await client.cosmos.bank.v1beta1.allBalances({
            address: walletAddress,
          });
          // NOTE: this UI only handles the translator factory tokens for now
          const seiCoin = response.balances.find(
            (coin) => coin.denom === "usei"
          );
          const translatedCoins = response.balances.filter((coin) =>
            coin.denom.startsWith(`factory/${SEI_TRANSLATOR}/`)
          );
          const translatedCoinInfos = await Promise.all(
            translatedCoins
              .filter((coin) =>
                coin.denom.startsWith(`factory/${SEI_TRANSLATOR}/`)
              )
              .map((coin) =>
                wasmClient.queryContractSmart(
                  cosmos.humanAddress(
                    "sei",
                    base58.decode(coin.denom.split("/")[2])
                  ),
                  {
                    token_info: {},
                  }
                )
              )
          );
          const tokenAccounts: NFTParsedTokenAccount[] = [
            ...(seiCoin
              ? [
                  {
                    amount: seiCoin.amount,
                    decimals: SEI_DECIMALS,
                    mintKey: seiCoin.denom,
                    publicKey: walletAddress,
                    uiAmount: Number(
                      formatUnits(BigInt(seiCoin.amount), SEI_DECIMALS)
                    ),
                    uiAmountString: formatUnits(
                      BigInt(seiCoin.amount),
                      SEI_DECIMALS
                    ),
                    isNativeAsset: true,
                    symbol: "SEI",
                    name: "Sei",
                  },
                ]
              : []),
            ...translatedCoins.map((coin, idx) => ({
              amount: coin.amount,
              decimals: translatedCoinInfos[idx].decimals,
              mintKey: coin.denom,
              publicKey: walletAddress,
              uiAmount: Number(
                formatUnits(
                  BigInt(coin.amount),
                  translatedCoinInfos[idx].decimals
                )
              ),
              uiAmountString: formatUnits(
                BigInt(coin.amount),
                translatedCoinInfos[idx].decimals
              ),
              isNativeAsset: false,
              symbol: translatedCoinInfos[idx].symbol,
              name: translatedCoinInfos[idx].name,
            })),
          ];
          setIsLoading(false);
          setBalances(tokenAccounts);
        } catch (e) {
          console.error(e);
          setIsLoading(false);
          setBalances(undefined);
        }
      })();
    } else {
      setIsLoading(false);
      setBalances(undefined);
    }
  }, [walletAddress, refresh]);
  const value = useMemo(() => ({ isLoading, balances }), [isLoading, balances]);
  return value;
}
