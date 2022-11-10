import { Coin, isSuiMoveObject } from "@mysten/sui.js";
import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { SUI_NATIVE_TOKEN_KEY } from "../utils/consts";
import { getProvider } from "../utils/sui";

export default function useSuiNativeBalance(
  address?: string,
  refreshRef?: MutableRefObject<() => void>
) {
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<bigint | undefined>(undefined);
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
    if (address) {
      setIsLoading(true);
      setBalance(undefined);

      // TODO: is this really the best way to get coin balance....
      const provider = getProvider();
      provider
        .getObjectsOwnedByAddress(address)
        .then((objects) =>
          objects.filter(
            (obj) => (obj.type = `0x2::coin::Coin<${SUI_NATIVE_TOKEN_KEY}>`)
          )
        )
        .then((objs) =>
          provider.getObjectBatch(objs.map((obj) => obj.objectId))
        )
        .then((objs) =>
          objs
            .map((obj) => (obj.details as any).data) // defeats the purpose of calling type guard
            .filter((obj) => isSuiMoveObject(obj) && obj.fields.balance)
        )
        .then((data) =>
          data
            .map((datum) => Coin.getBalance(datum))
            .reduce<bigint>((prev, curr) => prev + curr!, BigInt(0))
        )
        .then((value) => {
          setIsLoading(false);
          setBalance(value);
        })
        .catch((e) => {
          console.error(e);
          setIsLoading(false);
          setBalance(undefined);
        });
    } else {
      setIsLoading(false);
      setBalance(undefined);
    }
  }, [address, refresh]);
  const value = useMemo(() => ({ isLoading, balance }), [isLoading, balance]);
  return value;
}
