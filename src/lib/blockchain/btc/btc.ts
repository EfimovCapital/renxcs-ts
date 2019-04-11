import { Networks, Opcode, Script } from "bitcore-lib";
import { getUTXOs } from "../mercury";

const testnetMasterPKH = new Buffer("be8d41d9e47170a33d7d758ebf853551dea63ab8", "hex");

const createAddress = ({ mainnet, masterPKH }: { mainnet: boolean, masterPKH: Buffer }) =>
    (address: string) =>
        new Script()
            .add(new Buffer(address.substring(0, 2) === "0x" ? address.slice(2) : address, "hex"))
            .add(Opcode.OP_DROP)
            .add(Opcode.OP_DUP)
            .add(Opcode.OP_HASH160)
            .add(masterPKH)
            .add(Opcode.OP_EQUALVERIFY)
            .add(Opcode.OP_CHECKSIG)
            .toScriptHashOut().toAddress(mainnet ? Networks.livenet : Networks.testnet).toString();

export const createBTCTestnetAddress = createAddress({ mainnet: false, masterPKH: testnetMasterPKH });

const testnetMercury = "https://ren-mercury.herokuapp.com/btc-testnet3";

export interface BitcoinUTXO {
    txHash: string; // hex string without 0x prefix
    amount: number; // satoshis
    scriptPubKey: string; // hex string without 0x prefix
    vout: number;
}

export const getBTCTestnetUTXOs = getUTXOs<BitcoinUTXO>(testnetMercury);

// export interface FormattedUTXO extends BTCUTXO {
//     formatted: true;
// }

// const shift = 10 ** 8;

// export const formatUTXO = (utxo: UTXO): FormattedUTXO => {
//     return {
//         ...utxo,
//         scriptPubKey: new Address(new Buffer(utxo.scriptPubKey, "hex")).toString(),
//         amount: utxo.amount / shift,
//         formatted: true,
//     };
// };

// export const toBase58 = (hex: string): string =>
//     (new encoding.Base58({ buf: Buffer.from(hex, "hex") })).toString();
