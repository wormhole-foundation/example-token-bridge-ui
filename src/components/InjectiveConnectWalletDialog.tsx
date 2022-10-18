import {
  Dialog,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { Wallet } from "@injectivelabs/wallet-ts";
import { useCallback } from "react";
import {
  InjectiveWalletInfo,
  SUPPORTED_WALLETS,
  useInjectiveContext,
} from "../contexts/InjectiveWalletContext";

const useStyles = makeStyles((theme) => ({
  flexTitle: {
    display: "flex",
    alignItems: "center",
    "& > div": {
      flexGrow: 1,
      marginRight: theme.spacing(4),
    },
    "& > button": {
      marginRight: theme.spacing(-1),
    },
  },
  icon: {
    height: 24,
    width: 24,
  },
}));

const WalletOptions = ({
  walletInfo,
  connect,
  onClose,
}: {
  walletInfo: InjectiveWalletInfo;
  connect: (wallet: Wallet) => void;
  onClose: () => void;
}) => {
  const classes = useStyles();

  const { wallet, name, isInstalled, icon, url } = walletInfo;

  const handleClick = useCallback(() => {
    if (isInstalled) {
      connect(wallet);
    } else {
      window.open(url, "_blank", "noreferrer");
    }
    onClose();
  }, [connect, onClose, wallet, isInstalled, url]);

  return (
    <ListItem button onClick={handleClick}>
      <ListItemIcon>
        <img src={icon} alt={name} className={classes.icon} />
      </ListItemIcon>
      <ListItemText>{isInstalled ? name : `Install ${name}`}</ListItemText>
    </ListItem>
  );
};

const InjectiveConnectWalletDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { connect } = useInjectiveContext();
  const classes = useStyles();

  const installedWallets = SUPPORTED_WALLETS.filter(
    (walletInfo) => walletInfo.isInstalled
  ).map((walletInfo) => (
    <WalletOptions
      walletInfo={walletInfo}
      connect={connect}
      onClose={onClose}
      key={walletInfo.name}
    />
  ));

  const undetectedWallets = SUPPORTED_WALLETS.filter(
    (walletInfo) => !walletInfo.isInstalled
  ).map((walletInfo) => (
    <WalletOptions
      walletInfo={walletInfo}
      connect={connect}
      onClose={onClose}
      key={walletInfo.name}
    />
  ));

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>
        <div className={classes.flexTitle}>
          <div>Select your wallet</div>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <List>
        {installedWallets}
        {!!installedWallets.length && !!undetectedWallets.length && (
          <Divider variant="middle" />
        )}
        {undetectedWallets}
      </List>
    </Dialog>
  );
};

export default InjectiveConnectWalletDialog;
