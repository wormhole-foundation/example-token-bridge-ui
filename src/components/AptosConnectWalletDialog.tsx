import { WalletName, WalletReadyState } from "@manahippo/aptos-wallet-adapter";
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
import { useCallback } from "react";
import { useAptosContext } from "../contexts/AptosWalletContext";

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
  name,
  readyState,
  connect,
  onClose,
  icon,
}: {
  name: WalletName<string>;
  readyState: WalletReadyState;
  connect: (type: WalletName<string>) => void;
  onClose: () => void;
  icon: string;
}) => {
  const classes = useStyles();

  const handleClick = useCallback(() => {
    connect(name);
    onClose();
  }, [connect, onClose, name]);
  return (
    <ListItem button onClick={handleClick}>
      <ListItemIcon>
        <img src={icon} alt={name} className={classes.icon} />
      </ListItemIcon>
      <ListItemText>
        {readyState === WalletReadyState.Installed ? name : `Install ${name}`}
      </ListItemText>
    </ListItem>
  );
};

const AptosConnectWalletDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { wallets, connect } = useAptosContext();
  const classes = useStyles();

  const filteredConnections = wallets
    .filter(({ readyState }) => readyState === WalletReadyState.Installed)
    .map(({ adapter: { name, icon }, readyState }) => (
      <WalletOptions
        name={name}
        readyState={readyState}
        connect={connect}
        onClose={onClose}
        icon={icon}
        key={name}
      />
    ));

  const filteredInstallations = wallets
    .filter(({ readyState }) => readyState === WalletReadyState.NotDetected)
    .map(({ adapter: { name, icon }, readyState }) => (
      <WalletOptions
        name={name}
        readyState={readyState}
        connect={connect}
        onClose={onClose}
        icon={icon}
        key={name}
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
        {filteredConnections}
        {filteredInstallations && <Divider variant="middle" />}
        {filteredInstallations}
      </List>
    </Dialog>
  );
};

export default AptosConnectWalletDialog;
