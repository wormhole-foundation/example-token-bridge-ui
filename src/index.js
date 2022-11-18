import { CssBaseline } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import { SnackbarProvider } from "notistack";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AlgorandContextProvider } from "./contexts/AlgorandWalletContext";
import AptosWalletProvider from "./contexts/AptosWalletContext";
import { EthereumProviderProvider } from "./contexts/EthereumProviderContext";
import InjectiveWalletProvider from "./contexts/InjectiveWalletContext";
import { NearContextProvider } from "./contexts/NearWalletContext";
import { SolanaWalletProvider } from "./contexts/SolanaWalletContext.tsx";
import { TerraWalletProvider } from "./contexts/TerraWalletContext.tsx";
import XplaWalletProvider from "./contexts/XplaWalletContext";
import ErrorBoundary from "./ErrorBoundary";
import { theme } from "./muiTheme";
import { store } from "./store";

ReactDOM.render(
  <ErrorBoundary>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <SnackbarProvider maxSnack={3}>
            <SolanaWalletProvider>
              <EthereumProviderProvider>
                <TerraWalletProvider>
                  <AlgorandContextProvider>
                    <XplaWalletProvider>
                      <AptosWalletProvider>
                        <InjectiveWalletProvider>
                          <NearContextProvider>
                            <HashRouter>
                              <App />
                            </HashRouter>
                          </NearContextProvider>
                        </InjectiveWalletProvider>
                      </AptosWalletProvider>
                    </XplaWalletProvider>
                  </AlgorandContextProvider>
                </TerraWalletProvider>
              </EthereumProviderProvider>
            </SolanaWalletProvider>
          </SnackbarProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  </ErrorBoundary>,
  document.getElementById("root")
);
