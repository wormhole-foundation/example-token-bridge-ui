import { ChainId, CHAIN_ID_ETH } from "@certusone/wormhole-sdk";
import { Button, makeStyles, Tooltip, Typography } from "@material-ui/core";
import { FileCopy, OpenInNew } from "@material-ui/icons";
import { withStyles } from "@material-ui/styles";
import useCopyToClipboard from "../hooks/useCopyToClipboard";
import { CLUSTER, getExplorerName } from "../utils/consts";

const useStyles = makeStyles((theme) => ({
  mainTypog: {
    display: "inline-block",
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
  buttons: {
    marginLeft: ".5rem",
    marginRight: ".5rem",
  },
}));

const tooltipStyles = {
  tooltip: {
    minWidth: "max-content",
    textAlign: "center",
    "& > *": {
      margin: ".25rem",
    },
  },
};

// @ts-ignore
const StyledTooltip = withStyles(tooltipStyles)(Tooltip);

export default function SmartBlock({
  chainId,
  blockNumber,
}: {
  chainId: ChainId;
  blockNumber: number;
}) {
  const classes = useStyles();
  const explorerAddress =
    CLUSTER === "testnet" && chainId === CHAIN_ID_ETH
      ? `https://goerli.etherscan.io/block/${blockNumber}`
      : undefined;
  const explorerName = getExplorerName(chainId);

  const copyToClipboard = useCopyToClipboard(blockNumber.toString());

  const explorerButton = !explorerAddress ? null : (
    <Button
      size="small"
      variant="outlined"
      startIcon={<OpenInNew />}
      className={classes.buttons}
      href={explorerAddress}
      target="_blank"
      rel="noopener noreferrer"
    >
      {"View on " + explorerName}
    </Button>
  );
  const copyButton = (
    <Button
      size="small"
      variant="outlined"
      startIcon={<FileCopy />}
      onClick={copyToClipboard}
      className={classes.buttons}
    >
      Copy
    </Button>
  );

  const tooltipContent = (
    <div>
      {explorerButton}
      {copyButton}
    </div>
  );

  return (
    <StyledTooltip
      title={tooltipContent}
      interactive={true}
      className={classes.mainTypog}
    >
      <Typography
        variant={"body1"}
        className={classes.mainTypog}
        component="div"
      >
        {blockNumber}
      </Typography>
    </StyledTooltip>
  );
}
