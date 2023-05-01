import { JsonRpcProvider } from "@mysten/sui.js";
import { SUI_CONNECTION } from "./consts";

export const getSuiProvider = () => new JsonRpcProvider(SUI_CONNECTION);
