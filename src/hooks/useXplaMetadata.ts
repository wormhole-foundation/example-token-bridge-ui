import { LCDClient } from "@xpla/xpla.js";
import { useLayoutEffect, useMemo, useState } from "react";
import { DataWrapper } from "../store/helpers";
import { XPLA_LCD_CLIENT_CONFIG } from "../utils/consts";

export type XplaMetadata = {
  symbol?: string;
  logo?: string;
  tokenName?: string;
  decimals?: number;
};

const fetchSingleMetadata = async (address: string, lcd: LCDClient) =>
  lcd.wasm
    .contractQuery(address, {
      token_info: {},
    })
    .then(
      ({ symbol, name: tokenName, decimals }: any) =>
        ({
          symbol,
          tokenName,
          decimals,
        } as XplaMetadata)
    );

const fetchTerraMetadata = async (addresses: string[]) => {
  const lcd = new LCDClient(XPLA_LCD_CLIENT_CONFIG);
  const promises: Promise<XplaMetadata>[] = [];
  addresses.forEach((address) => {
    promises.push(fetchSingleMetadata(address, lcd));
  });
  const resultsArray = await Promise.all(promises);
  const output = new Map<string, XplaMetadata>();
  addresses.forEach((address, index) => {
    output.set(address, resultsArray[index]);
  });

  return output;
};

const useXplaMetadata = (
  addresses: string[]
): DataWrapper<Map<string, XplaMetadata>> => {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Map<string, XplaMetadata> | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    if (addresses.length) {
      setIsFetching(true);
      setError("");
      setData(null);
      fetchTerraMetadata(addresses).then(
        (results) => {
          if (!cancelled) {
            setData(results);
            setIsFetching(false);
          }
        },
        () => {
          if (!cancelled) {
            setError("Could not retrieve contract metadata");
            setIsFetching(false);
          }
        }
      );
    }
    return () => {
      cancelled = true;
    };
  }, [addresses]);

  return useMemo(
    () => ({
      data,
      isFetching,
      error,
      receivedAt: null,
    }),
    [data, isFetching, error]
  );
};

export default useXplaMetadata;
