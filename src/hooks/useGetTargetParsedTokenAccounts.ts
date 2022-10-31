import {
  CHAIN_ID_ALGORAND,
  CHAIN_ID_APTOS,
  CHAIN_ID_INJECTIVE,
  CHAIN_ID_NEAR,
  CHAIN_ID_SEI,
  CHAIN_ID_SOLANA,
  CHAIN_ID_SUI,
  CHAIN_ID_XPLA,
  ensureHexPrefix,
  ethers_contracts,
  isEVMChain,
  isNativeDenomInjective,
  isNativeDenomXpla,
  isTerraChain,
  parseSmartContractStateResponse,
  terra,
} from "@certusone/wormhole-sdk";
import { useWallet as useSeiWallet } from "@sei-js/react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@suiet/wallet-kit";
import { LCDClient } from "@terra-money/terra.js";
import { useConnectedWallet } from "@terra-money/wallet-provider";
import { useConnectedWallet as useXplaConnectedWallet } from "@xpla/wallet-provider";
import { LCDClient as XplaLCDClient } from "@xpla/xpla.js";
import { Algodv2 } from "algosdk";
import { formatUnits } from "ethers/lib/utils";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAlgorandContext } from "../contexts/AlgorandWalletContext";
import { useAptosContext } from "../contexts/AptosWalletContext";
import { useEthereumProvider } from "../contexts/EthereumProviderContext";
import { useInjectiveContext } from "../contexts/InjectiveWalletContext";
import { useNearContext } from "../contexts/NearWalletContext";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import {
  selectTransferTargetAsset,
  selectTransferTargetChain,
} from "../store/selectors";
import { setTargetParsedTokenAccount } from "../store/transferSlice";
import { getAptosClient } from "../utils/aptos";
import {
  ALGORAND_HOST,
  NATIVE_NEAR_DECIMALS,
  NATIVE_NEAR_PLACEHOLDER,
  SOLANA_HOST,
  XPLA_LCD_CLIENT_CONFIG,
  getEvmChainId,
  getTerraConfig,
} from "../utils/consts";
import {
  NATIVE_INJECTIVE_DECIMALS,
  getInjectiveBankClient,
  getInjectiveWasmClient,
} from "../utils/injective";
import { makeNearAccount } from "../utils/near";
import { getSeiWasmClient } from "../utils/sei";
import { getSuiProvider } from "../utils/sui";
import { NATIVE_TERRA_DECIMALS } from "../utils/terra";
import { NATIVE_XPLA_DECIMALS } from "../utils/xpla";
import { createParsedTokenAccount } from "./useGetSourceParsedTokenAccounts";
import useMetadata from "./useMetadata";
import { fetchSingleMetadata } from "./useNearMetadata";

function useGetTargetParsedTokenAccounts() {
  const dispatch = useDispatch();
  const targetChain = useSelector(selectTransferTargetChain);
  const targetAsset = useSelector(selectTransferTargetAsset);
  const targetAssetArrayed = useMemo(
    () => (targetAsset ? [targetAsset] : []),
    [targetAsset]
  );
  const metadata = useMetadata(targetChain, targetAssetArrayed);
  const tokenName =
    (targetAsset && metadata.data?.get(targetAsset)?.tokenName) || undefined;
  const symbol =
    (targetAsset && metadata.data?.get(targetAsset)?.symbol) || undefined;
  const logo =
    (targetAsset && metadata.data?.get(targetAsset)?.logo) || undefined;
  const decimals =
    (targetAsset && metadata.data?.get(targetAsset)?.decimals) || undefined;
  const solanaWallet = useSolanaWallet();
  const solPK = solanaWallet?.publicKey;
  const terraWallet = useConnectedWallet();
  const {
    provider,
    signerAddress,
    chainId: evmChainId,
  } = useEthereumProvider();
  const xplaWallet = useXplaConnectedWallet();
  const hasCorrectEvmNetwork = evmChainId === getEvmChainId(targetChain);
  const { accounts: algoAccounts } = useAlgorandContext();
  const { account: aptosAccount } = useAptosContext();
  const aptosAddress = aptosAccount?.address?.toString();
  const { address: injAddress } = useInjectiveContext();
  const { accounts: seiAccounts } = useSeiWallet();
  const seiAddress = seiAccounts.length ? seiAccounts[0].address : null;
  const { accountId: nearAccountId } = useNearContext();
  const { address: suiAddress } = useWallet();
  const hasResolvedMetadata = metadata.data || metadata.error;
  useEffect(() => {
    // targetParsedTokenAccount is cleared on setTargetAsset, but we need to clear it on wallet changes too
    dispatch(setTargetParsedTokenAccount(undefined));
    if (!targetAsset || !hasResolvedMetadata) {
      return;
    }
    let cancelled = false;

    if (isTerraChain(targetChain) && terraWallet) {
      const lcd = new LCDClient(getTerraConfig(targetChain));
      if (terra.isNativeDenom(targetAsset)) {
        lcd.bank
          .balance(terraWallet.walletAddress)
          .then(([coins]) => {
            const balance = coins.get(targetAsset)?.amount?.toString();
            if (balance && !cancelled) {
              dispatch(
                setTargetParsedTokenAccount(
                  createParsedTokenAccount(
                    "",
                    "",
                    balance,
                    NATIVE_TERRA_DECIMALS,
                    Number(formatUnits(balance, NATIVE_TERRA_DECIMALS)),
                    formatUnits(balance, NATIVE_TERRA_DECIMALS),
                    symbol,
                    tokenName,
                    logo
                  )
                )
              );
            }
          })
          .catch(() => {
            if (!cancelled) {
              // TODO: error state
            }
          });
      } else {
        lcd.wasm
          .contractQuery(targetAsset, {
            token_info: {},
          })
          .then((info: any) =>
            lcd.wasm
              .contractQuery(targetAsset, {
                balance: {
                  address: terraWallet.walletAddress,
                },
              })
              .then((balance: any) => {
                if (balance && info && !cancelled) {
                  dispatch(
                    setTargetParsedTokenAccount(
                      createParsedTokenAccount(
                        "",
                        "",
                        balance.balance.toString(),
                        info.decimals,
                        Number(formatUnits(balance.balance, info.decimals)),
                        formatUnits(balance.balance, info.decimals),
                        symbol,
                        tokenName,
                        logo
                      )
                    )
                  );
                }
              })
          )
          .catch(() => {
            if (!cancelled) {
              // TODO: error state
            }
          });
      }
    }

    if (targetChain === CHAIN_ID_XPLA && xplaWallet) {
      const lcd = new XplaLCDClient(XPLA_LCD_CLIENT_CONFIG);
      if (isNativeDenomXpla(targetAsset)) {
        lcd.bank
          .balance(xplaWallet.walletAddress)
          .then(([coins]) => {
            const balance = coins.get(targetAsset)?.amount?.toString();
            if (balance && !cancelled) {
              dispatch(
                setTargetParsedTokenAccount(
                  createParsedTokenAccount(
                    "",
                    "",
                    balance,
                    NATIVE_XPLA_DECIMALS,
                    Number(formatUnits(balance, NATIVE_XPLA_DECIMALS)),
                    formatUnits(balance, NATIVE_XPLA_DECIMALS),
                    symbol,
                    tokenName,
                    logo
                  )
                )
              );
            }
          })
          .catch(() => {
            if (!cancelled) {
              // TODO: error state
            }
          });
      } else {
        lcd.wasm
          .contractQuery(targetAsset, {
            token_info: {},
          })
          .then((info: any) =>
            lcd.wasm
              .contractQuery(targetAsset, {
                balance: {
                  address: xplaWallet.xplaAddress,
                },
              })
              .then((balance: any) => {
                if (balance && info && !cancelled) {
                  dispatch(
                    setTargetParsedTokenAccount(
                      createParsedTokenAccount(
                        "",
                        "",
                        balance.balance.toString(),
                        info.decimals,
                        Number(formatUnits(balance.balance, info.decimals)),
                        formatUnits(balance.balance, info.decimals),
                        symbol,
                        tokenName,
                        logo
                      )
                    )
                  );
                }
              })
          )
          .catch(() => {
            if (!cancelled) {
              // TODO: error state
            }
          });
      }
    }

    if (targetChain === CHAIN_ID_SEI && seiAddress) {
      (async () => {
        // if (isNativeDenomXpla(targetAsset)) {
        //   lcd.bank
        //     .balance(xplaWallet.walletAddress)
        //     .then(([coins]) => {
        //       const balance = coins.get(targetAsset)?.amount?.toString();
        //       if (balance && !cancelled) {
        //         dispatch(
        //           setTargetParsedTokenAccount(
        //             createParsedTokenAccount(
        //               "",
        //               "",
        //               balance,
        //               NATIVE_XPLA_DECIMALS,
        //               Number(formatUnits(balance, NATIVE_XPLA_DECIMALS)),
        //               formatUnits(balance, NATIVE_XPLA_DECIMALS),
        //               symbol,
        //               tokenName,
        //               logo
        //             )
        //           )
        //         );
        //       }
        //     })
        //     .catch(() => {
        //       if (!cancelled) {
        //         // TODO: error state
        //       }
        //     });
        // } else {
        try {
          const client = await getSeiWasmClient();
          const info = await client.queryContractSmart(targetAsset, {
            token_info: {},
          });
          const balance = await client.queryContractSmart(targetAsset, {
            balance: {
              address: seiAddress,
            },
          });
          if (balance && info && !cancelled) {
            dispatch(
              setTargetParsedTokenAccount(
                createParsedTokenAccount(
                  "",
                  "",
                  balance.balance.toString(),
                  info.decimals,
                  Number(formatUnits(balance.balance, info.decimals)),
                  formatUnits(balance.balance, info.decimals),
                  symbol,
                  tokenName,
                  logo
                )
              )
            );
          }
        } catch (e) {
          if (!cancelled) {
            // TODO: error state
          }
        }
        // }
      })();
    }

    if (
      targetChain === CHAIN_ID_APTOS &&
      aptosAddress &&
      decimals !== undefined
    ) {
      (async () => {
        try {
          const client = getAptosClient();
          let value = BigInt(0);
          try {
            // This throws if the user never registered for the token
            const coinStore = `0x1::coin::CoinStore<${ensureHexPrefix(
              targetAsset
            )}>`;
            value = (
              (await client.getAccountResource(aptosAddress, coinStore))
                .data as any
            ).coin.value;
          } catch (e) {}
          if (!cancelled) {
            dispatch(
              setTargetParsedTokenAccount(
                createParsedTokenAccount(
                  "",
                  "",
                  value.toString(),
                  decimals,
                  Number(formatUnits(value, decimals)),
                  formatUnits(value, decimals),
                  symbol,
                  tokenName,
                  logo
                )
              )
            );
          }
        } catch (e) {
          if (!cancelled) {
            console.error(e);
            // TODO: error state
          }
        }
      })();
    }

    if (targetChain === CHAIN_ID_INJECTIVE && injAddress) {
      if (isNativeDenomInjective(targetAsset)) {
        const client = getInjectiveBankClient();
        client
          .fetchBalance({ accountAddress: injAddress, denom: targetAsset })
          .then(({ amount }) => {
            if (!cancelled) {
              dispatch(
                setTargetParsedTokenAccount(
                  createParsedTokenAccount(
                    "",
                    "",
                    amount,
                    NATIVE_INJECTIVE_DECIMALS,
                    Number(formatUnits(amount, NATIVE_INJECTIVE_DECIMALS)),
                    formatUnits(amount, NATIVE_INJECTIVE_DECIMALS),
                    symbol,
                    tokenName,
                    logo
                  )
                )
              );
            }
          })
          .catch(() => {
            if (!cancelled) {
              // TODO: error state
            }
          });
      } else {
        const client = getInjectiveWasmClient();
        client
          .fetchSmartContractState(
            targetAsset,
            Buffer.from(
              JSON.stringify({
                token_info: {},
              })
            ).toString("base64")
          )
          .then((infoData) =>
            client
              .fetchSmartContractState(
                targetAsset,
                Buffer.from(
                  JSON.stringify({
                    balance: {
                      address: injAddress,
                    },
                  })
                ).toString("base64")
              )
              .then((balanceData) => {
                if (infoData && balanceData && !cancelled) {
                  const balance = parseSmartContractStateResponse(balanceData);
                  const info = parseSmartContractStateResponse(infoData);
                  dispatch(
                    setTargetParsedTokenAccount(
                      createParsedTokenAccount(
                        "",
                        "",
                        balance.balance.toString(),
                        info.decimals,
                        Number(formatUnits(balance.balance, info.decimals)),
                        formatUnits(balance.balance, info.decimals),
                        symbol,
                        tokenName,
                        logo
                      )
                    )
                  );
                }
              })
          )
          .catch((e) => {
            if (!cancelled) {
              // TODO: error state
            }
          });
      }
    }

    if (targetChain === CHAIN_ID_SUI && suiAddress) {
      const provider = getSuiProvider();
      (async () => {
        try {
          const { totalBalance } = await provider.getBalance({
            owner: suiAddress,
            coinType: targetAsset,
          });
          const response = await provider.getCoinMetadata({
            coinType: targetAsset,
          });
          if (!response) {
            throw new Error("bad response");
          }
          const { decimals, symbol } = response;
          if (!cancelled) {
            dispatch(
              setTargetParsedTokenAccount(
                createParsedTokenAccount(
                  "",
                  "",
                  totalBalance,
                  decimals,
                  Number(formatUnits(totalBalance, decimals)),
                  formatUnits(totalBalance, decimals),
                  symbol,
                  tokenName,
                  logo
                )
              )
            );
          }
        } catch (e: any) {
          console.error("error getting target balance", e, e?.message, e?.code);
          if (!cancelled) {
            // TODO: error state
          }
        }
      })();
    }

    if (targetChain === CHAIN_ID_SOLANA && solPK) {
      let mint;
      try {
        mint = new PublicKey(targetAsset);
      } catch (e) {
        return;
      }
      const connection = new Connection(SOLANA_HOST, "confirmed");
      connection
        .getParsedTokenAccountsByOwner(solPK, { mint })
        .then(({ value }) => {
          if (!cancelled) {
            if (value.length) {
              dispatch(
                setTargetParsedTokenAccount(
                  createParsedTokenAccount(
                    value[0].pubkey.toString(),
                    value[0].account.data.parsed?.info?.mint,
                    value[0].account.data.parsed?.info?.tokenAmount?.amount,
                    value[0].account.data.parsed?.info?.tokenAmount?.decimals,
                    value[0].account.data.parsed?.info?.tokenAmount?.uiAmount,
                    value[0].account.data.parsed?.info?.tokenAmount
                      ?.uiAmountString,
                    symbol,
                    tokenName,
                    logo
                  )
                )
              );
            } else {
              // TODO: error state
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            // TODO: error state
          }
        });
    }
    if (
      isEVMChain(targetChain) &&
      provider &&
      signerAddress &&
      hasCorrectEvmNetwork
    ) {
      const token = ethers_contracts.TokenImplementation__factory.connect(
        targetAsset,
        provider
      );
      token
        .decimals()
        .then((decimals) => {
          token.balanceOf(signerAddress).then((n) => {
            if (!cancelled) {
              dispatch(
                setTargetParsedTokenAccount(
                  // TODO: verify accuracy
                  createParsedTokenAccount(
                    signerAddress,
                    token.address,
                    n.toString(),
                    decimals,
                    Number(formatUnits(n, decimals)),
                    formatUnits(n, decimals),
                    symbol,
                    tokenName,
                    logo
                  )
                )
              );
            }
          });
        })
        .catch(() => {
          if (!cancelled) {
            // TODO: error state
          }
        });
    }
    if (
      targetChain === CHAIN_ID_ALGORAND &&
      algoAccounts[0] &&
      decimals !== undefined
    ) {
      const algodClient = new Algodv2(
        ALGORAND_HOST.algodToken,
        ALGORAND_HOST.algodServer,
        ALGORAND_HOST.algodPort
      );
      try {
        const tokenId = BigInt(targetAsset);
        algodClient
          .accountInformation(algoAccounts[0].address)
          .do()
          .then((accountInfo) => {
            let balance = 0;
            if (tokenId === BigInt(0)) {
              balance = accountInfo.amount;
            } else {
              let ret = 0;
              const assets: Array<any> = accountInfo.assets;
              assets.forEach((asset) => {
                if (tokenId === BigInt(asset["asset-id"])) {
                  ret = asset.amount;
                  return;
                }
              });
              balance = ret;
            }
            dispatch(
              setTargetParsedTokenAccount(
                createParsedTokenAccount(
                  algoAccounts[0].address,
                  targetAsset,
                  balance.toString(),
                  decimals,
                  Number(formatUnits(balance, decimals)),
                  formatUnits(balance, decimals),
                  symbol,
                  tokenName,
                  logo
                )
              )
            );
          })
          .catch(() => {
            if (!cancelled) {
              // TODO: error state
            }
          });
      } catch (e) {
        if (!cancelled) {
          // TODO: error state
        }
      }
    }
    if (targetChain === CHAIN_ID_NEAR && nearAccountId) {
      try {
        makeNearAccount(nearAccountId)
          .then((account) => {
            if (targetAsset === NATIVE_NEAR_PLACEHOLDER) {
              account
                .getAccountBalance()
                .then((balance) => {
                  if (!cancelled) {
                    dispatch(
                      setTargetParsedTokenAccount(
                        createParsedTokenAccount(
                          nearAccountId, //publicKey
                          NATIVE_NEAR_PLACEHOLDER, //the app doesn't like when this isn't truthy
                          balance.available, //amount
                          NATIVE_NEAR_DECIMALS,
                          parseFloat(
                            formatUnits(balance.available, NATIVE_NEAR_DECIMALS)
                          ),
                          formatUnits(
                            balance.available,
                            NATIVE_NEAR_DECIMALS
                          ).toString(),
                          "NEAR",
                          "Near",
                          undefined, //TODO logo
                          true
                        )
                      )
                    );
                  }
                })
                .catch(() => {
                  if (!cancelled) {
                    // TODO: error state
                  }
                });
            } else {
              fetchSingleMetadata(targetAsset, account)
                .then(({ decimals }) => {
                  account
                    .viewFunction(targetAsset, "ft_balance_of", {
                      account_id: nearAccountId,
                    })
                    .then((balance) => {
                      if (!cancelled) {
                        dispatch(
                          setTargetParsedTokenAccount(
                            createParsedTokenAccount(
                              nearAccountId,
                              targetAsset,
                              balance.toString(),
                              decimals,
                              Number(formatUnits(balance, decimals)),
                              formatUnits(balance, decimals),
                              symbol,
                              tokenName,
                              logo
                            )
                          )
                        );
                      }
                    })
                    .catch(() => {
                      if (!cancelled) {
                        // TODO: error state
                      }
                    });
                })
                .catch(() => {
                  if (!cancelled) {
                    // TODO: error state
                  }
                });
            }
          })
          .catch(() => {
            if (!cancelled) {
              // TODO: error state
            }
          });
      } catch (e) {
        if (!cancelled) {
          // TODO: error state
        }
      }
    }
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    targetAsset,
    targetChain,
    provider,
    signerAddress,
    solanaWallet,
    solPK,
    terraWallet,
    hasCorrectEvmNetwork,
    hasResolvedMetadata,
    symbol,
    tokenName,
    logo,
    algoAccounts,
    decimals,
    xplaWallet,
    aptosAddress,
    injAddress,
    nearAccountId,
    seiAddress,
    suiAddress,
  ]);
}

export default useGetTargetParsedTokenAccounts;
