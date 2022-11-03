import {
  AppBar,
  Box,
  Button,
  Container,
  makeStyles,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { useCallback } from "react";
import { useLocation } from "react-router";
import { Link, Redirect, Route, Switch } from "react-router-dom";
import Attest from "./components/Attest";
import Footer from "./components/Footer";
import HeaderText from "./components/HeaderText";
import NFT from "./components/NFT";
import NFTOriginVerifier from "./components/NFTOriginVerifier";
import Recovery from "./components/Recovery";
import TokenOriginVerifier from "./components/TokenOriginVerifier";
import Transfer from "./components/Transfer";
import UnwrapNative from "./components/UnwrapNative";
import USDC from "./components/USDC";
import WithdrawTokensTerra from "./components/WithdrawTokensTerra";
import { CLUSTER } from "./utils/consts";

const useStyles = makeStyles((theme) => ({
  appBar: {
    background: "transparent",
    marginTop: theme.spacing(2),
    "& > .MuiToolbar-root": {
      margin: "auto",
      width: "100%",
      maxWidth: 1440,
    },
  },
  spacer: {
    flex: 1,
    width: "100vw",
  },
  link: {
    ...theme.typography.body2,
    fontWeight: 600,
    marginLeft: theme.spacing(4),
    textUnderlineOffset: "6px",
    [theme.breakpoints.down("sm")]: {
      marginLeft: theme.spacing(2.5),
    },
    [theme.breakpoints.down("xs")]: {
      marginLeft: theme.spacing(1),
    },
    "&.active": {
      textDecoration: "underline",
    },
  },
  bg: {
    // background:
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
  },
  brandLink: {
    display: "inline-flex",
    alignItems: "center",
    "&:hover": {
      textDecoration: "none",
    },
  },
}));

function App() {
  const classes = useStyles();
  const { pathname } = useLocation();
  const handleClusterChange = useCallback((event) => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("cluster", event.target.value);
    window.location.search = urlParams;
  }, []);
  return (
    <div className={classes.bg}>
      {
        <AppBar position="static" elevation={0} style={{ marginBottom: 40 }}>
          <Toolbar variant="dense">
            <Button component={Link} to="/usdc">
              USDC
            </Button>
            <Button component={Link} to="/transfer">
              Tokens
            </Button>
            <Button component={Link} to="/nft">
              NFTs
            </Button>
            <Button component={Link} to="/redeem">
              Redeem
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Select
              value={CLUSTER}
              onChange={handleClusterChange}
              variant="outlined"
              margin="dense"
            >
              <MenuItem value="testnet">Testnet</MenuItem>
              <MenuItem value="devnet">Devnet</MenuItem>
            </Select>
          </Toolbar>
        </AppBar>
      }
      {["/transfer", "/nft", "/redeem"].includes(pathname) ? (
        <Container maxWidth="md" style={{ paddingBottom: 24 }}>
          <HeaderText
            white
            subtitle={
              <>
                <Typography>
                  This is a developmental token bridge that tests transfers
                  across chains for tokens and NFTs wrapped by Wormhole.
                </Typography>
              </>
            }
          >
            Token Bridge
          </HeaderText>
        </Container>
      ) : null}
      <Switch>
        <Route exact path="/usdc">
          <USDC />
        </Route>
        <Route exact path="/transfer">
          <Transfer />
        </Route>
        <Route exact path="/nft">
          <NFT />
        </Route>
        <Route exact path="/redeem">
          <Recovery />
        </Route>
        <Route exact path="/nft-origin-verifier">
          <NFTOriginVerifier />
        </Route>
        <Route exact path="/token-origin-verifier">
          <TokenOriginVerifier />
        </Route>
        <Route exact path="/register">
          <Attest />
        </Route>
        <Route exact path="/withdraw-tokens-terra">
          <WithdrawTokensTerra />
        </Route>
        <Route exact path="/unwrap-native">
          <UnwrapNative />
        </Route>
        <Route>
          <Redirect to="/transfer" />
        </Route>
      </Switch>
      <div className={classes.spacer} />
      <div className={classes.gradientRight}></div>
      <div className={classes.gradientRight2}></div>
      <div className={classes.gradientLeft}></div>
      <div className={classes.gradientLeft2}></div>
      <Footer />
    </div>
  );
}

export default App;
