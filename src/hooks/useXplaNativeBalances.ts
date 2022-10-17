import { LCDClient } from "@xpla/xpla.js";
import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { XPLA_LCD_CLIENT_CONFIG } from "../utils/consts";

export interface XplaNativeBalances {
  [index: string]: string;
}

export default function useXplaNativeBalances(
  walletAddress?: string,
  refreshRef?: MutableRefObject<() => void>
) {
  const [isLoading, setIsLoading] = useState(true);
  const [balances, setBalances] = useState<XplaNativeBalances | undefined>({});
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
      const lcd = new LCDClient(XPLA_LCD_CLIENT_CONFIG);
      lcd.bank
        .balance(walletAddress)
        .then(([coins]) => {
          // coins doesn't support reduce
          const balancePairs = coins.map(({ amount, denom }) => [
            denom,
            amount,
          ]);
          const balance = balancePairs.reduce((obj, current) => {
            obj[current[0].toString()] = current[1].toString();
            return obj;
          }, {} as XplaNativeBalances);
          setIsLoading(false);
          setBalances(balance);
        })
        .catch((e) => {
          console.error(e);
          setIsLoading(false);
          setBalances(undefined);
        });
    } else {
      setIsLoading(false);
      setBalances(undefined);
    }
  }, [walletAddress, refresh]);
  const value = useMemo(() => ({ isLoading, balances }), [isLoading, balances]);
  return value;
}
