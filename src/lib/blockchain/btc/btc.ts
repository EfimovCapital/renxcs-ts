import { Networks, Opcode, Script } from "bitcore-lib";

import { testnetMasterPKH } from "../../darknode/publicKey";
import { getUTXOs } from "../mercury";
import { createAddress } from "./common";

export const createBTCAddress = createAddress(Networks, Opcode, Script);

const testnetMercury = "https://ren-mercury.herokuapp.com/btc-testnet3";

export interface BitcoinUTXO {
    txHash: string; // hex string without 0x prefix
    amount: number; // satoshis
    scriptPubKey: string; // hex string without 0x prefix
    vout: number;
}

export const getBTCTestnetUTXOs = getUTXOs<BitcoinUTXO>(testnetMercury);

export const createBTCTestnetAddress = createBTCAddress({ mainnet: false, masterPKH: testnetMasterPKH });
