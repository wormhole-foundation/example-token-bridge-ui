import { makeStyles } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { IsTransferLimitedResult } from "../../hooks/useIsTransferLimited";
import {
  CHAINS_BY_ID,
  USD_NUMBER_FORMATTER as USD_FORMATTER,
} from "../../utils/consts";

const useStyles = makeStyles((theme) => ({
  alert: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

const TransferLimitedWarning = ({
  isTransferLimited,
}: {
  isTransferLimited: IsTransferLimitedResult;
}) => {
  const classes = useStyles();
  if (
    isTransferLimited.isLimited &&
    isTransferLimited.reason &&
    isTransferLimited.limits
  ) {
    const chainName =
      CHAINS_BY_ID[isTransferLimited.limits.chainId]?.name || "unknown";
    const message =
      isTransferLimited.reason === "EXCEEDS_MAX_NOTIONAL"
        ? `This transfer's estimated notional value would exceed the notional value limit for transfers on ${chainName} (${USD_FORMATTER.format(
            isTransferLimited.limits.chainNotionalLimit
          )}) and may be subject to a 24 hour delay.`
        : isTransferLimited.reason === "EXCEEDS_LARGE_TRANSFER_LIMIT"
        ? `This transfer's estimated notional value may exceed the notional value for large transfers on ${chainName} (${USD_FORMATTER.format(
            isTransferLimited.limits.chainBigTransactionSize
          )}) and may be subject to a 24 hour delay.`
        : isTransferLimited.reason === "EXCEEDS_REMAINING_NOTIONAL"
        ? `This transfer's estimated notional value may exceed the remaining notional value available for transfers on ${chainName} (${USD_FORMATTER.format(
            isTransferLimited.limits.chainRemainingAvailableNotional
          )}) and may be subject to a delay.`
        : "";
    return (
      <Alert variant="outlined" severity="warning" className={classes.alert}>
        {message}
      </Alert>
    );
  }
  return null;
};

export default TransferLimitedWarning;
