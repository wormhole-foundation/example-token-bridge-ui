import { ChainId } from "@certusone/wormhole-sdk";
import { CHAIN_ID_NEON } from "@certusone/wormhole-sdk/lib/cjs/utils/consts";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DataWrapper,
  errorDataWrapper,
  fetchDataWrapper,
  getEmptyDataWrapper,
  receiveDataWrapper,
} from "../store/helpers";
import { selectNeonRelayerInfo } from "../store/selectors";
import {
  errorNeonRelayerInfo,
  fetchNeonRelayerInfo,
  receiveNeonRelayerInfo,
  setNeonRelayerInfo,
} from "../store/transferSlice";
import { NEON_RELAYER_URL, NEON_SHOULD_RELAY_URL } from "../utils/consts";

export interface NeonRelayerInfo {
  shouldRelay: boolean;
  msg: string;
}

export const useNeonRelayerInfo = (
  targetChain: ChainId,
  vaaNormalizedAmount: string | undefined,
  originAsset: string | undefined,
  useStore: boolean = true
) => {
  // within flow, update the store
  const dispatch = useDispatch();
  // within recover, use internal state
  const [state, setState] = useState<DataWrapper<NeonRelayerInfo>>(
    getEmptyDataWrapper()
  );
  useEffect(() => {
    let cancelled = false;
    if (
      !NEON_RELAYER_URL ||
      !targetChain ||
      targetChain !== CHAIN_ID_NEON ||
      !vaaNormalizedAmount ||
      !originAsset
    ) {
      useStore
        ? dispatch(setNeonRelayerInfo())
        : setState(getEmptyDataWrapper());
      return;
    }
    useStore ? dispatch(fetchNeonRelayerInfo()) : setState(fetchDataWrapper());
    (async () => {
      try {
        const result = await axios.get(NEON_SHOULD_RELAY_URL, {
          params: {
            targetChain,
            originAsset,
            amount: vaaNormalizedAmount,
          },
        });
        if (!cancelled) {
          useStore
            ? dispatch(receiveNeonRelayerInfo(result.data))
            : setState(receiveDataWrapper(result.data));
        }
      } catch (e) {
        if (!cancelled) {
          useStore
            ? dispatch(
                errorNeonRelayerInfo(
                  "Failed to retrieve the Neon relayer info."
                )
              )
            : setState(
                errorDataWrapper("Failed to retrieve the Neon relayer info.")
              );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetChain, vaaNormalizedAmount, originAsset, dispatch, useStore]);
  const neonRelayerInfoFromStore = useSelector(selectNeonRelayerInfo);
  return useStore ? neonRelayerInfoFromStore : state;
};
