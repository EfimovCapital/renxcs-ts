import * as React from "react";

import Web3 from "web3";

import { List, Map, OrderedMap } from "immutable";
import { connect, ConnectedReturnType } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { HttpProvider } from "web3-providers";

import { BitcoinUTXO } from "../../lib/blockchain/btc/btc";
import { ZcashUTXO } from "../../lib/blockchain/btc/zec";
import { Currency, DepositAddresses, UTXO } from "../../lib/blockchain/depositAddresses";
import { setEthereumAddress, setEvents } from "../../store/actions/general/generalActions";
import { ApplicationData, Burn, Deposit, EventType, Mint, XCSEvent } from "../../store/types/general";
import { CurrenciesBlock } from "../views/CurrenciesBlock";
import { ReceiveAddress } from "../views/ReceiveAddress";
import { ShowUTXOs } from "../views/ShowUTXOs";

interface InjectedEthereum extends HttpProvider {
    enable: () => Promise<void>;
}

declare global {
    interface Window {
        ethereum?: InjectedEthereum;
        web3?: Web3;
    }
}

export const getWeb3 = async () => new Promise<Web3>(async (resolve, reject) => {
    // Modern dApp browsers...
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            // Request account access if needed
            await window.ethereum.enable();
            resolve(new Web3(window.web3.currentProvider));

        } catch (error) {
            reject(error);
        }
    } else if (window.web3) {
        // Legacy dApp browsers...
        window.web3 = new Web3(window.web3.currentProvider);
        // Accounts always exposed
        resolve(new Web3(window.web3.currentProvider));
    } else {
        // Non-dApp browsers...
        reject("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }
});

const SwapControllerClass = (props: Props) => {
    const { store: { ethereumAddress, darknodeGroup } } = props;
    let events = props.store.events;

    // tslint:disable: prefer-const
    const [blur, setBlur] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>(undefined);
    const [mounted, setMounted] = React.useState(false);
    const [checking, setChecking] = React.useState(false);

    let [redeeming, setRedeeming] = React.useState(Map<string, boolean>());
    let [depositAddresses, setDepositAddresses] = React.useState<DepositAddresses | undefined>(undefined);
    let [checkingResponse, setCheckingResponse] = React.useState(Map<string, boolean>());
    // tslint:enable: prefer-const

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const element = (event.target as HTMLInputElement);
        const value = element.value;
        props.actions.setEthereumAddress(value);
        // setDepositAddresses(undefined);
        // setUTXOs(List());
        setBlur(true);
    };

    const checkForResponse = async (id: string) => {
        const event = events.get(id);
        if (!event || event.type !== EventType.Mint) {
            return;
        }
        const mintEvent: Mint = event as Mint;
        checkingResponse = checkingResponse.set(id, true);
        setCheckingResponse(checkingResponse);
        try {
            const signature = await darknodeGroup.checkForResponse(mintEvent);
            events = events.set(id, mintEvent.set("mintTransaction", signature));
            if (ethereumAddress) {
                props.actions.setEvents({ ethereumAddress, events });
            }
        } catch (error) {
            console.error(error);
        }
        checkingResponse = checkingResponse.remove(id);
        setCheckingResponse(checkingResponse);
    };

    const onSubmit = async () => {
        if (!depositAddresses) {
            setError(`No deposit address defined.`);
            return;
        }

        setBlur(false);
        setChecking(true);
        setError(undefined);

        // const promises = renVMMessages.map(async (_, time) => {
        //     // tslint:disable-next-line: no-console
        //     return checkForResponse(time).catch(console.error);
        // }).valueSeq().toArray();

        const newUtxos = await depositAddresses.getUTXOs();
        newUtxos.map(utxo => {
            const txHash = utxo.utxo.txHash;
            if (!events.has(txHash)) {
                events = events.set(txHash, new Deposit({
                    id: txHash,
                    utxo: List([utxo.utxo]),
                    currency: utxo.currency,
                }));
                if (ethereumAddress) {
                    props.actions.setEvents({ ethereumAddress, events });
                }
            }
        });

        // try {
        //     await Promise.all(promises);
        // } catch (error) {
        //     // tslint:disable-next-line: no-console
        //     console.error(error);
        // }

        setChecking(false);
    };

    // Call onSubmit without passing in click-event parameters
    const onRefresh = () => onSubmit();

    // tslint:disable-next-line: no-any
    const onGenerateAddress = () => {
        setError(undefined);

        if (ethereumAddress) {
            if (depositAddresses && depositAddresses.receiveAddress === ethereumAddress) {
                // do nothing
            } else {
                try {
                    depositAddresses = new DepositAddresses(ethereumAddress);
                    setDepositAddresses(depositAddresses);
                } catch (error) {
                    setError(`${error && error.toString ? error.toString() : error}`);
                    return;
                }
            }
            // tslint:disable-next-line: no-console
            onSubmit().catch(console.error);
        }
    };

    if (!mounted && ethereumAddress && ethereumAddress.length === 42 && !depositAddresses) {
        onGenerateAddress();
    }

    if (!mounted) {
        setMounted(true);
    }

    const onRedeem = async (deposit: Deposit) => {
        console.log("onRedeem");

        const id = deposit.id;

        redeeming = redeeming.set(id, true);
        setRedeeming(redeeming);
        if (!ethereumAddress) {
            return;
        }

        try {
            const utxo = deposit.utxo.first(undefined);
            const utxoWithCurrency: UTXO | undefined = (deposit.currency === Currency.BTC) ? { currency: Currency.BTC, utxo: utxo as BitcoinUTXO } :
                (deposit.currency === Currency.ZEC) ? { currency: Currency.ZEC, utxo: utxo as ZcashUTXO } : undefined;
            if (!utxoWithCurrency) {
                throw new Error(`Unsupported deposit token: ${deposit.currency}`);
            }

            const messages = await darknodeGroup.submitDeposits(ethereumAddress, utxoWithCurrency);
            // TODO: Get messageID from majority
            events = events.set(id, new Mint({
                id,
                utxos: List<UTXO>([utxoWithCurrency]),
                messageID: messages.first({ messageID: "" }).messageID,
                messageIDs: messages.map(x => x.messageID),
            }));
            if (ethereumAddress) {
                props.actions.setEvents({ ethereumAddress, events });
            }
        } catch (error) {
            console.error(error);
            setError(`${error && error.toString ? error.toString() : error}`);
        }

        redeeming = redeeming.remove(id);
        setRedeeming(redeeming);
    };

    const getMetaMaskAddress = async () => {
        try {
            const web3 = await getWeb3();
            const addresses = await web3.eth.getAccounts();
            props.actions.setEthereumAddress(addresses[0]);
            setBlur(true);
        } catch (error) {
            console.error(error);
            setError(`${error && error.toString ? error.toString() : error}`);
        }
    };

    const burn = async (currency: Currency, amount: string) => {
        setError(undefined);
        if (depositAddresses && amount !== "0") {
            try {
                const to = prompt(`Enter recipient ${currency.toUpperCase()} address`);
                if (!to) {
                    throw new Error(`Address must not be empty`);
                }
                await depositAddresses.burn(currency, to, amount);
                const id: string = Date();
                events = events.set(id, new Burn({
                    id,
                    currency,
                    amount,
                    to,
                    messageID: "",
                    burnTransaction: undefined,
                }));
                if (ethereumAddress) {
                    props.actions.setEvents({ ethereumAddress, events });
                }
            } catch (error) {
                console.error(error);
                setError(`${error && error.toString ? error.toString() : error}`);
            }
        }
    };

    return <div className="swap container">
        <ReceiveAddress onGenerateAddress={onGenerateAddress} ethereumAddress={ethereumAddress} onChange={onChange} getMetaMaskAddress={getMetaMaskAddress} />
        {error ? <p className="red">{error}</p> : null}
        {depositAddresses ?
            <div className={`swap--bottom ${blur ? "blur" : ""}`}>
                <CurrenciesBlock burn={burn} depositAddresses={depositAddresses} />
                <ShowUTXOs checking={checking} onRefresh={onRefresh} events={events} redeeming={redeeming} onRedeem={onRedeem} checkingResponse={checkingResponse} checkForResponse={checkForResponse} />
            </div> : null}
    </div >;
};

const mapStateToProps = (state: ApplicationData) => ({
    store: {
        ethereumAddress: state.general.ethereumAddress,
        darknodeGroup: state.general.darknodeGroup,
        events: state.general.allEvents.get(state.general.ethereumAddress || "") || OrderedMap<string, XCSEvent>(),
    }
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        setEthereumAddress,
        setEvents,
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
}

export const SwapController = connect(mapStateToProps, mapDispatchToProps)(SwapControllerClass);
