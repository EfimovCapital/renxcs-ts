import { Address, Networks, Opcode, Script } from "bitcore-lib-zcash";

import { testnetMasterPKH } from "../../darknode/publicKey";
import { getUTXOs } from "../mercury";
import { createAddress } from "./common";

export const createZECAddress = createAddress(Networks, Opcode, Script);

const testnetMercury = "https://ren-mercury.herokuapp.com/zec-testnet";

export interface ZcashUTXO {
    txHash: string; // hex string without 0x prefix
    amount: number; // satoshis
    scriptPubKey: string; // hex string without 0x prefix
    vout: number;
}

export const getZECTestnetUTXOs = getUTXOs<ZcashUTXO>(testnetMercury);

export const createZECTestnetAddress = createZECAddress({ mainnet: false, masterPKH: testnetMasterPKH });

export const zecAddressToHex = (address: string) => `0x${(new Address(address)).toBuffer().toString("hex")}`;
