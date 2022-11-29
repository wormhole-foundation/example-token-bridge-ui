import { ChainId, CHAIN_ID_AVAX, CHAIN_ID_ETH } from "@certusone/wormhole-sdk";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ParsedTokenAccount } from "./transferSlice";

export interface USDCTransferInfo {
  vaaHex: string | null;
  circleBridgeMessage: string;
  circleAttestation: string;
}

export interface USDCSliceState {
  sourceChain: ChainId;
  targetChain: ChainId;
  balance: ParsedTokenAccount | null;
  relayerFee: string | null;
  maxSwapAmount: string | null;
  estimatedSwapAmount: string | null;
  amount: string;
  shouldRelay: boolean;
  toNativeAmount: string;
  isSending: boolean;
  sourceTxHash: string;
  sourceTxConfirmed: boolean;
  transferInfo: USDCTransferInfo | null;
  isRedeeming: boolean;
  isRedeemComplete: boolean;
  targetTxHash: string;
  allowanceError: string;
  shouldApproveUnlimited: boolean;
}

const initialState: USDCSliceState = {
  sourceChain: CHAIN_ID_ETH,
  targetChain: CHAIN_ID_AVAX,
  balance: null,
  relayerFee: null,
  maxSwapAmount: null,
  estimatedSwapAmount: null,
  amount: "",
  shouldRelay: false,
  toNativeAmount: "0",
  isSending: false,
  sourceTxHash: "",
  sourceTxConfirmed: false,
  transferInfo: null,
  isRedeeming: false,
  isRedeemComplete: false,
  targetTxHash: "",
  allowanceError: "",
  shouldApproveUnlimited: false,
};

export const usdcSlice = createSlice({
  name: "usdc",
  initialState,
  reducers: {
    setSourceChain: (state, action: PayloadAction<ChainId>) => {
      const prevSourceChain = state.sourceChain;
      state.sourceChain = action.payload;
      if (state.targetChain === action.payload) {
        state.targetChain = prevSourceChain;
      }
    },
    setTargetChain: (state, action: PayloadAction<ChainId>) => {
      const prevTargetChain = state.sourceChain;
      state.targetChain = action.payload;
      if (state.sourceChain === action.payload) {
        state.sourceChain = prevTargetChain;
      }
    },
    setBalance: (state, action: PayloadAction<ParsedTokenAccount | null>) => {
      state.balance = action.payload;
    },
    setRelayerFee: (state, action: PayloadAction<string | null>) => {
      state.relayerFee = action.payload;
    },
    setMaxSwapAmount: (state, action: PayloadAction<string | null>) => {
      state.maxSwapAmount = action.payload;
    },
    setEstimatedSwapAmount: (state, action: PayloadAction<string | null>) => {
      state.estimatedSwapAmount = action.payload;
    },
    setAmount: (state, action: PayloadAction<string>) => {
      state.amount = action.payload;
    },
    setShouldRelay: (state, action: PayloadAction<boolean>) => {
      state.shouldRelay = action.payload;
    },
    setToNativeAmount: (state, action: PayloadAction<string>) => {
      state.toNativeAmount = action.payload;
    },
    setIsSending: (state, action: PayloadAction<boolean>) => {
      state.isSending = action.payload;
    },
    setSourceTxHash: (state, action: PayloadAction<string>) => {
      state.sourceTxHash = action.payload;
    },
    setSourceTxConfirmed: (state, action: PayloadAction<boolean>) => {
      state.sourceTxConfirmed = action.payload;
    },
    setTransferInfo: (
      state,
      action: PayloadAction<USDCTransferInfo | null>
    ) => {
      state.transferInfo = action.payload;
    },
    setIsRedeeming: (state, action: PayloadAction<boolean>) => {
      state.isRedeeming = action.payload;
    },
    setIsRedeemComplete: (state, action: PayloadAction<boolean>) => {
      state.isRedeemComplete = action.payload;
    },
    setTargetTxHash: (state, action: PayloadAction<string>) => {
      state.targetTxHash = action.payload;
    },
    setAllowanceError: (state, action: PayloadAction<string>) => {
      state.allowanceError = action.payload;
    },
    setShouldApproveUnlimited: (state, action: PayloadAction<boolean>) => {
      state.shouldApproveUnlimited = action.payload;
    },
    reset: (state) => ({
      ...initialState,
      sourceChain: state.sourceChain,
      targetChain: state.targetChain,
    }),
  },
});

export const {
  setSourceChain,
  setTargetChain,
  setBalance,
  setRelayerFee,
  setMaxSwapAmount,
  setEstimatedSwapAmount,
  setAmount,
  setShouldRelay,
  setToNativeAmount,
  setIsSending,
  setSourceTxHash,
  setSourceTxConfirmed,
  setTransferInfo,
  setIsRedeeming,
  setIsRedeemComplete,
  setTargetTxHash,
  setAllowanceError,
  setShouldApproveUnlimited,
  reset,
} = usdcSlice.actions;

export default usdcSlice.reducer;
