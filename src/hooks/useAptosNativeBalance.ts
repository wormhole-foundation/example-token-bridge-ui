import { AptosAccount, CoinClient } from "aptos";
import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { getAptosClient } from "../utils/aptos";

export default function useAptosNativeBalance(
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
      const account = new AptosAccount(undefined, address);
      const client = getAptosClient();
      const coinClient = new CoinClient(client);
      coinClient
        .checkBalance(account)
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
