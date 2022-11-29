import { RootState } from ".";

export const selectSourceChain = (state: RootState) => state.usdc.sourceChain;

export const selectTargetChain = (state: RootState) => state.usdc.targetChain;

export const selectBalance = (state: RootState) => state.usdc.balance;

export const selectRelayerFee = (state: RootState) => state.usdc.relayerFee;

export const selectMaxSwapAmount = (state: RootState) =>
  state.usdc.maxSwapAmount;

export const selectEstimatedSwapAmount = (state: RootState) =>
  state.usdc.estimatedSwapAmount;

export const selectAmount = (state: RootState) => state.usdc.amount;

export const selectShouldRelay = (state: RootState) => state.usdc.shouldRelay;

export const selectToNativeAmount = (state: RootState) =>
  state.usdc.toNativeAmount;

export const selectIsSending = (state: RootState) => state.usdc.isSending;

export const selectSourceTxHash = (state: RootState) => state.usdc.sourceTxHash;

export const selectSourceTxConfirmed = (state: RootState) =>
  state.usdc.sourceTxConfirmed;

export const selectTransferInfo = (state: RootState) => state.usdc.transferInfo;

export const selectIsRedeeming = (state: RootState) => state.usdc.isRedeeming;

export const selectIsRedeemComplete = (state: RootState) =>
  state.usdc.isRedeemComplete;

export const selectTargetTxHash = (state: RootState) => state.usdc.targetTxHash;

export const selectAllowanceError = (state: RootState) =>
  state.usdc.allowanceError;

export const selectShouldApproveUnlimited = (state: RootState) =>
  state.usdc.shouldApproveUnlimited;
