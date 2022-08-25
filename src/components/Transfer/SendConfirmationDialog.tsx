import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@material-ui/core";
import { ArrowDownward } from "@material-ui/icons";
import { useSelector } from "react-redux";
import {
  selectTransferSourceChain,
  selectTransferSourceParsedTokenAccount,
} from "../../store/selectors";
import { CHAINS_BY_ID } from "../../utils/consts";
import SmartAddress from "../SmartAddress";
import { useTargetInfo } from "./Target";

function SendConfirmationContent({
  open,
  onClose,
  onClick,
}: {
  open: boolean;
  onClose: () => void;
  onClick: () => void;
}) {
  const sourceChain = useSelector(selectTransferSourceChain);
  const sourceParsedTokenAccount = useSelector(
    selectTransferSourceParsedTokenAccount
  );
  const { targetChain, targetAsset, symbol, tokenName, logo } = useTargetInfo();

  const sendConfirmationContent = (
    <>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogContent>
        {targetAsset ? (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Typography variant="subtitle1" style={{ marginBottom: 8 }}>
              You are about to perform this transfer:
            </Typography>
            <SmartAddress
              variant="h6"
              chainId={sourceChain}
              parsedTokenAccount={sourceParsedTokenAccount}
              isAsset
            />
            <div>
              <Typography variant="caption">
                {CHAINS_BY_ID[sourceChain].name}
              </Typography>
            </div>
            <div style={{ paddingTop: 4 }}>
              <ArrowDownward fontSize="inherit" />
            </div>
            <SmartAddress
              variant="h6"
              chainId={targetChain}
              address={targetAsset}
              symbol={symbol}
              tokenName={tokenName}
              logo={logo}
              isAsset
            />
            <div>
              <Typography variant="caption">
                {CHAINS_BY_ID[targetChain].name}
              </Typography>
            </div>
          </div>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onClick}
          size={"medium"}
        >
          {"Confirm"}
        </Button>
      </DialogActions>
    </>
  );

  return sendConfirmationContent;
}

export default function SendConfirmationDialog({
  open,
  onClick,
  onClose,
}: {
  open: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <SendConfirmationContent
        open={open}
        onClose={onClose}
        onClick={onClick}
      />
    </Dialog>
  );
}
