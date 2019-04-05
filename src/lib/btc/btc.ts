import Axios from "axios";

import { Networks, Opcode, Script } from "bitcore-lib";

export const testnetMasterPKH = new Buffer("e02cabac3a62655335b1227dfdecfff27b5f6111", "hex");

export const createAddress = ({ mainnet, masterPKH }: { mainnet: boolean, masterPKH: Buffer }) =>
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

export const createTestnetAddress = createAddress({ mainnet: false, masterPKH: testnetMasterPKH });

export const testnetMercury = "https://ren-mercury.herokuapp.com/btc-testnet3";

export interface UTXO {
    txHash: string; // hex string without 0x prefix
    amount: number; // satoshis
    scriptPubKey: string; // hex string without 0x prefix
    vout: number;
}

export const getUTXOs = (endpoint: string) => async (address: string, limit: number, confirmations: number) => {
    let resp;
    try {
        resp = await Axios.get(`${endpoint}/utxo/${address}?limit=${limit}&confirmations=${confirmations}`);
    } catch (err) {
        throw err;
        // respErr:= MercuryError{ }
        // if err := json.NewDecoder(resp.Body).Decode(& respErr); err != nil {
        //     return utxos, err
        // }
        // return utxos, fmt.Errorf("request failed with (%d): %s", resp.StatusCode, respErr.Error)
    }

    return resp.data;
};

export const getTestnetUTXOs = getUTXOs(testnetMercury);

export interface FormattedUTXO extends UTXO {
    formatted: true;
}

// const shift = 10 ** 8;

// export const formatUTXO = (utxo: UTXO): FormattedUTXO => {
//     return {
//         ...utxo,
//         scriptPubKey: new Address(new Buffer(utxo.scriptPubKey, "hex")).toString(),
//         amount: utxo.amount / shift,
//         formatted: true,
//     };
// };
