import {
  assertChain,
  CHAIN_ID_APTOS,
  coalesceChainId,
  ensureHexPrefix,
  getAssetFullyQualifiedType,
  hexToUint8Array,
  WormholeWrappedInfo,
} from "@certusone/wormhole-sdk";
import { AptosClient, Types } from "aptos";
import { APTOS_URL } from "./consts";
import { OriginInfo, State } from "@certusone/wormhole-sdk/lib/esm/aptos/types";
import { sha3_256 } from "js-sha3";
import { _parseVAAAlgorand } from "@certusone/wormhole-sdk/lib/esm/algorand";

export enum AptosNetwork {
  Testnet = "Testnet",
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Localhost = "Localhost",
}

export const getAptosWallet = () => {
  if ("aptos" in window) {
    return (window as any).aptos;
  } else if ("martian" in window) {
    return (window as any).martian;
  } else {
    window.open("https://petra.app/", "_blank", "noopener noreferrer");
    return undefined;
  }
};

export const getAptosClient = () => new AptosClient(APTOS_URL);

export const isValidAptosType = (address: string) =>
  /(0x)?[0-9a-fA-F]+::\w+::\w+/g.test(address);

// TODO: update with this fix
export async function getOriginalAssetAptos(
  client: AptosClient,
  tokenBridgeAddress: string,
  fullyQualifiedType: string
): Promise<WormholeWrappedInfo> {
  let originInfo: OriginInfo | undefined;
  if (!/(0x)?[0-9a-fA-F]+::\w+::\w+/g.test(fullyQualifiedType)) {
    throw new Error("Need fully qualified address");
  }
  const assetAddress = fullyQualifiedType.split("::")[0];
  try {
    originInfo = (
      await client.getAccountResource(
        assetAddress,
        `${tokenBridgeAddress}::state::OriginInfo`
      )
    ).data as OriginInfo;
  } catch (e) {
    return {
      isWrapped: false,
      chainId: CHAIN_ID_APTOS,
      assetAddress: hexToUint8Array(sha3_256(fullyQualifiedType)),
    };
  }
  if (!!originInfo) {
    // wrapped asset
    const chainId = parseInt(originInfo.token_chain.number as any); // TODO: THIS IS A STRING, I CHECKED
    assertChain(chainId);
    const assetAddress = hexToUint8Array(
      // strip "0x"
      originInfo.token_address.external_address.substring(2)
    );
    return {
      isWrapped: true,
      chainId,
      assetAddress,
    };
  } else {
    // native asset
    return {
      isWrapped: false,
      chainId: CHAIN_ID_APTOS,
      assetAddress: hexToUint8Array(sha3_256(fullyQualifiedType)),
    };
  }
}

// TODO: add to SDK
export async function queryExternalIdAptos(
  client: AptosClient,
  tokenBridgeAddress: string,
  hash: string
): Promise<string | null> {
  // get handle
  tokenBridgeAddress = ensureHexPrefix(tokenBridgeAddress);
  const state = (
    await client.getAccountResource(
      tokenBridgeAddress,
      `${tokenBridgeAddress}::state::State`
    )
  ).data as State;
  const handle = state.native_infos.handle;
  try {
    // when accessing Set<T>, key is type T and value is 0
    const typeInfo = await client.getTableItem(handle, {
      key_type: `${tokenBridgeAddress}::token_hash::TokenHash`,
      value_type: "0x1::type_info::TypeInfo",
      key: { hash },
    });
    if (!typeInfo) {
      return null;
    }
    // {
    //   account_address: "0x1"
    //   module_name: "0x6170746f735f636f696e"
    //   struct_name: "0x4170746f73436f696e"
    // }
    return `${typeInfo.account_address}::${Buffer.from(
      typeInfo.module_name.substring(2),
      "hex"
    ).toString("ascii")}::${Buffer.from(
      typeInfo.struct_name.substring(2),
      "hex"
    ).toString("ascii")}`;
  } catch {
    return null;
  }
}

// TODO: update in the SDK, it didn't handle an Origin aptos correctly
export const completeTransferAndRegister = async (
  tokenBridgeAddress: string,
  transferVAA: Uint8Array
): Promise<Types.EntryFunctionPayload> => {
  if (!tokenBridgeAddress) throw new Error("Need token bridge address.");

  const parsedVAA = _parseVAAAlgorand(transferVAA);
  if (!parsedVAA.FromChain || !parsedVAA.Contract || !parsedVAA.ToChain) {
    throw new Error("VAA does not contain required information");
  }

  if (parsedVAA.ToChain !== CHAIN_ID_APTOS) {
    throw new Error("Transfer is not destined for Aptos");
  }

  assertChain(parsedVAA.FromChain);
  const assetType =
    parsedVAA.FromChain === CHAIN_ID_APTOS
      ? await queryExternalIdAptos(
          getAptosClient(),
          tokenBridgeAddress,
          parsedVAA.Contract
        )
      : getAssetFullyQualifiedType(
          tokenBridgeAddress,
          coalesceChainId(parsedVAA.FromChain),
          parsedVAA.Contract
        );
  if (!assetType) throw new Error("Invalid asset address.");

  return {
    function: `${tokenBridgeAddress}::complete_transfer::submit_vaa_and_register_entry`,
    type_arguments: [assetType],
    arguments: [transferVAA],
  };
};

export async function waitForSignAndSubmitTransaction(
  transaction: any
): Promise<string> {
  const wallet = getAptosWallet();
  try {
    let hash = "";
    if (wallet.generateSignAndSubmitTransaction) {
      // Martian
      hash = await wallet.generateSignAndSubmitTransaction(
        wallet.address,
        transaction
      );
    } else {
      // Petra
      hash = (await wallet.signAndSubmitTransaction(transaction)).hash;
    }
    if (!hash) {
      throw new Error("Invalid hash");
    }
    const client = getAptosClient();
    await client.waitForTransaction(hash);
    return hash;
  } catch (e) {
    throw e;
  }
}
