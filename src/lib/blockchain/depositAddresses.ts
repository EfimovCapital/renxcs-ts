import { List, Map as ImmutableMap } from "immutable";

import Web3 from "web3";

import { Contract } from "web3-eth-contract";

import { INFURA } from "../util/environmentVariables";
import { BitcoinUTXO, createBTCTestnetAddress, getBTCTestnetUTXOs } from "./btc/btc";
import { createZECTestnetAddress, getZECTestnetUTXOs, ZcashUTXO } from "./btc/zec";
import { bridgedToken, zBTCAddress, zZECAddress } from "./eth/eth";

export enum Currency {
    BTC = "btc",
    ZEC = "zec",
    ETH = "eth"
}

export type UTXO = { currency: Currency.BTC, utxo: BitcoinUTXO } | { currency: Currency.ZEC, utxo: ZcashUTXO };

export class DepositAddresses {
    public receiveAddress: string;

    public depositAddresses: Map<Currency, string>;

    private readonly web3: Web3 | undefined;
    private readonly zBTC: Contract | undefined;
    private readonly zZEC: Contract | undefined;

    constructor(receiveAddress: string) {
        this.receiveAddress = receiveAddress;

        this.depositAddresses = (new Map<Currency, string>())
            .set(Currency.ZEC, createZECTestnetAddress(receiveAddress))
            .set(Currency.BTC, createBTCTestnetAddress(receiveAddress))
            .set(Currency.ETH, receiveAddress)
            ;

        if (INFURA) {
            this.web3 = new Web3(INFURA);
            this.zBTC = bridgedToken(this.web3, zBTCAddress);
            this.zZEC = bridgedToken(this.web3, zZECAddress);
        }
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

    public getBalances = async () => {
        let balances = ImmutableMap<string, string>();

        for (const { curr, contract } of [
            { curr: Currency.BTC, contract: this.zBTC },
            { curr: Currency.ZEC, contract: this.zZEC },
        ]) {
            if (this.web3 && contract) {
                try {
                    balances = balances.set(curr, this.web3.utils.fromWei(await contract.methods.balanceOf(this.receiveAddress).call()));
                } catch (error) {
                    console.error(error);
                }
            }
        }

        return balances;
    }

    public getBalance = async (currency: Currency): Promise<string> => {
        switch (currency) {
            case Currency.BTC:
                return (this.web3 && this.zBTC) ?
                    this.web3.utils.fromWei((await this.zBTC.methods.balanceOf(this.receiveAddress).call()).toString()) :
                    "0";
            case Currency.ZEC:
                return (this.web3 && this.zZEC) ?
                    this.web3.utils.fromWei((await this.zZEC.methods.balanceOf(this.receiveAddress).call()).toString()) :
                    "0";
            case Currency.ETH:
                return (this.web3) ?
                    this.web3.utils.fromWei((await this.web3.eth.getBalance(this.receiveAddress)).toString()) :
                    "0";
        }
    }
}
