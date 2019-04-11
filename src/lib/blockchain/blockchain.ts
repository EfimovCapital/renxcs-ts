import { List } from "immutable";

import { BitcoinUTXO, createBTCTestnetAddress, getBTCTestnetUTXOs } from "./btc/btc";
import { createZECTestnetAddress, getZECTestnetUTXOs, ZcashUTXO } from "./zec/zec";

export enum Currency {
    BTC = "btc",
    ZEC = "zec",
    ETH = "eth"
}

export type UTXO = { currency: Currency.BTC, utxo: BitcoinUTXO } | { currency: Currency.ZEC, utxo: ZcashUTXO };

export class DepositAddresses {
    public receiveAddress: string;

    public depositAddresses: Map<Currency, string>;

    constructor(receiveAddress: string) {
        this.receiveAddress = receiveAddress;

        this.depositAddresses = (new Map<Currency, string>())
            .set(Currency.ZEC, createZECTestnetAddress(receiveAddress))
            .set(Currency.BTC, createBTCTestnetAddress(receiveAddress))
            .set(Currency.ETH, receiveAddress)
            ;
    }

    public getUTXOs = async (limit = 10, confirmations = 0): Promise<List<UTXO>> => {
        let utxos = List<UTXO>();

        const btcDepositAddress = this.depositAddresses.get(Currency.BTC);
        if (btcDepositAddress) {
            try {
                const newBitcoinUTXOs: Array<{ currency: Currency.BTC, utxo: BitcoinUTXO }> = (await getBTCTestnetUTXOs(btcDepositAddress, limit, confirmations)).map(utxo => ({ currency: Currency.BTC, utxo }));
                utxos = utxos.concat(List(newBitcoinUTXOs));
            } catch (error) {
                console.error(error);
            }
        }

        const zecDepositAddress = this.depositAddresses.get(Currency.ZEC);
        if (zecDepositAddress) {
            try {
                const newZcashUTXOs: Array<{ currency: Currency.ZEC, utxo: BitcoinUTXO }> = (await getZECTestnetUTXOs(zecDepositAddress, limit, confirmations)).map(utxo => ({ currency: Currency.ZEC, utxo }));
                utxos = utxos.concat(List(newZcashUTXOs));
            } catch (error) {
                console.error(error);
            }
        }

        return utxos;
    }
}
