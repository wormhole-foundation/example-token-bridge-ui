import {
  Dialog,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { useCallback } from "react";
import { useSuiContext } from "../contexts/SuiWalletContext";

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
  connect,
  onClose,
  icon,
}: {
  name: string;
  connect: () => void;
  onClose: () => void;
  icon: string;
}) => {
  const classes = useStyles();
  const handleClick = useCallback(() => {
    connect();
    onClose();
  }, [connect, onClose, name]);

  return (
    <ListItem button onClick={handleClick}>
      <ListItemIcon>
        <img src={icon} alt={name} className={classes.icon} />
      </ListItemIcon>
      <ListItemText>{name}</ListItemText>
    </ListItem>
  );
};

const SuiConnectWalletDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { wallets, select } = useSuiContext();
  const classes = useStyles();

  const filteredConnections = wallets.map(({ name, icon }) => (
    <WalletOptions
      name={name}
      connect={() => select(name)}
      onClose={onClose}
      icon={icon ?? ""}
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
      <List>{filteredConnections}</List>
    </Dialog>
  );
};

export default SuiConnectWalletDialog;
