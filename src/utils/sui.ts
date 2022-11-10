import { JsonRpcProvider } from "@mysten/sui.js";
import { SUI_URL } from "./consts";

export const getProvider = () => new JsonRpcProvider(SUI_URL);
