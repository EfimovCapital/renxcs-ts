import * as React from "react";

import CircularProgressBar from "react-circular-progressbar";
import Web3 from "web3";

import { Loading, TokenIcon } from "@renex/react-components";
import { connect, ConnectedReturnType } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { HttpProvider } from "web3-providers";

import { createTestnetAddress, getTestnetUTXOs, UTXO } from "../../lib/btc/btc";
import { addToMessageToUtxos, addToRedeemedUTXOs, addToRenVMMessages, addToSignatures, addToUtxoToMessage, setEthereumAddress } from "../../store/actions/general/generalActions";
import { ApplicationData } from "../../store/types/general";

import { List, Map } from "immutable";
import { ReactComponent as MetaMask } from "../../styles/images/metamask.svg";

import "react-circular-progressbar/dist/styles.css";

interface InjectedEthereum extends HttpProvider {
    enable: () => Promise<void>;
}

declare global {
    interface Window {
        ethereum?: InjectedEthereum;
        web3?: Web3;
    }
}

const showCircle = (percentage: number) => {
    return <CircularProgressBar
        className="circle--progress"
        percentage={percentage}
        strokeWidth={18}
        styles={{
            path: {
                stroke: "#006FE8",
                strokeLinecap: "butt",
                // strokeOpacity: 0.6,
            },
            trail: {
                stroke: "#006FE8",
                strokeOpacity: 0.2,
            },
        }}
    />;
};

const getWeb3 = async () => new Promise<Web3>(async (resolve, reject) => {
    // Modern dApp browsers...
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            // Request account access if needed
            await window.ethereum.enable();
            resolve(window.web3);

        } catch (error) {
            reject(error);
        }
    } else if (window.web3) {
        // Legacy dApp browsers...
        window.web3 = new Web3(window.web3.currentProvider);
        // Accounts always exposed
        resolve(window.web3);
    } else {
        // Non-dApp browsers...
        reject("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }
});

const SwapControllerClass = (props: Props) => {
    const { store: { ethereumAddress, redeemedUTXOs, darknodeGroup, renVMMessages, signatures, utxoToMessage, messageToUtxos } } = props;

    const [mounted, setMounted] = React.useState(false);

    const [error, setError] = React.useState<string | undefined>(undefined);
    const [depositAddress, setDepositAddress] = React.useState<{ zec: string; btc: string; eth: string } | undefined>(undefined);
    const [checking, setChecking] = React.useState(false);
    const [utxos, setUTXOs] = React.useState<UTXO[]>([]);
    const [redeeming, setRedeeming] = React.useState(false);
    const [showingDeposit, setShowingDeposit] = React.useState<string | undefined>();
    const [checkingResponse, setCheckingResponse] = React.useState(Map<string, boolean>());
    const [redeemingOnEthereum, setRedeemingOnEthereum] = React.useState(Map<string, boolean>());

    const onChange = (event: React.FormEvent<HTMLInputElement>) => {
        const element = (event.target as HTMLInputElement);
        const value = element.value;
        props.actions.setEthereumAddress(value);
        setDepositAddress(undefined);
        setUTXOs([]);
    };

    const checkForResponse = async (id: string) => {
        const renVMMessage = renVMMessages.get(id);
        if (!renVMMessage) {
            return;
        }
        setCheckingResponse(checkingResponse.set(id, true));
        try {
            const signature = await darknodeGroup.checkForResponse(renVMMessage);
            props.actions.addToSignatures({ utxo: id, signature });
        } catch (error) {
            console.error(error);
        }
        setCheckingResponse(checkingResponse.remove(id));
    };

    const onSubmit = async (altDepositAddress?: string) => {
        altDepositAddress = altDepositAddress || (depositAddress && depositAddress.btc) || "";
        if (!altDepositAddress) {
            setError(`No deposit address defined.`);
            return;
        }

        setChecking(true);
        setError(undefined);

        const promises = renVMMessages.map(async (_, time) => {
            // tslint:disable-next-line: no-console
            return checkForResponse(time).catch(console.error);
        }).valueSeq().toArray();

        try {
            const newUTXOs = await getTestnetUTXOs(altDepositAddress, 10, 0);
            setUTXOs(newUTXOs);
        } catch (error) {
            setError(`${error && error.toString ? error.toString() : error}`);
        }

        try {
            await Promise.all(promises);
        } catch (error) {
            // tslint:disable-next-line: no-console
            console.error(error);
        }

        setChecking(false);
    };

    // Call onSubmit without passing in click-event parameters
    const onRefresh = () => onSubmit();

    // tslint:disable-next-line: no-any
    const onGenerateAddress = (e?: any) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        setError(undefined);
        setUTXOs([]);
        if (ethereumAddress) {
            let btcAddress: string;
            try {
                btcAddress = createTestnetAddress(ethereumAddress);
            } catch (error) {
                setError(`${error && error.toString ? error.toString() : error}`);
                return;
            }
            setDepositAddress({ btc: btcAddress, zec: "NO ZCASH PLS", eth: ethereumAddress });
            // tslint:disable-next-line: no-console
            onSubmit(btcAddress).catch(console.error);
        }
    };

    if (!mounted && ethereumAddress && ethereumAddress.length === 42 && !depositAddress) {
        onGenerateAddress();
    }

    if (!mounted) {
        setMounted(true);
    }

    const onRedeem = async () => {
        setRedeeming(true);
        if (!ethereumAddress) {
            return;
        }

        const id = Date().toString();

        try {
            const messages = await darknodeGroup.submitDeposits(ethereumAddress);
            props.actions.addToRenVMMessages({ utxo: id, messages });
            props.actions.addToMessageToUtxos({ message: id, utxos: List(utxos) });
        } catch (error) {
            console.error(error);
            setRedeeming(false);
            setError(`${error && error.toString ? error.toString() : error}`);
            return;
        }
        for (const utxo of utxos) {
            props.actions.addToRedeemedUTXOs(utxo.txHash);
            props.actions.addToUtxoToMessage({ utxo: utxo.txHash, message: id });
        }
        setRedeeming(false);
    };

    const getMetaMaskAddress = async () => {
        try {
            const web3 = await getWeb3();
            const addresses = await web3.eth.getAccounts();
            props.actions.setEthereumAddress(addresses[0]);
        } catch (error) {
            setError(`${error && error.toString ? error.toString() : error}`);
        }
    };

    const hideDeposit = (): void => {
        setShowingDeposit(undefined);
    };

    const showDeposit = (e: React.MouseEvent<HTMLDivElement>): void => {
        const id = e.currentTarget.dataset ? e.currentTarget.dataset.id : undefined;
        if (id) {
            if (id === showingDeposit) {
                hideDeposit();
            } else {
                setShowingDeposit(id);
            }
        }
    };

    const redeemOnEthereum = async (id: string) => {
        const signature = signatures.get(id);
        if (!signature) {
            return;
        }
        setRedeemingOnEthereum(redeemingOnEthereum.set(id, true));
        try {
            // const web3 = await getWeb3();
        } catch (error) {
            setError(`${error && error.toString ? error.toString() : error}`);
        }
        setRedeemingOnEthereum(redeemingOnEthereum.remove(id));
    };

    return <div className="swap container">
        <div className="block">
            <form onSubmit={onGenerateAddress} className="swap--eth--form">
                <div className="swap--eth--input">
                    <input type="text" value={ethereumAddress} onChange={onChange} placeholder="Enter Ethereum address for receiving" />
                    <button className="metamask-logo" onClick={getMetaMaskAddress}><MetaMask /></button>
                    <input type="submit" className="button--white swap--eth--submit" disabled={!ethereumAddress} value="Go" />
                </div>
            </form>
        </div>
        {depositAddress ?
            <>
                <div className="block">
                    <h3>Currencies</h3>
                    <div className="currencies">
                        {["btc", "zec", "eth"].map((currency) => {
                            return <div
                                className={`currency ${currency}`}
                                data-id={currency}
                                onClick={showDeposit}
                                role="button"
                                key={currency}
                            >
                                <TokenIcon token={currency.toUpperCase()} />
                            </div>;
                        })}
                    </div>

                    <div className={`deposit-address ${showingDeposit}`}>
                        <div>
                            {showingDeposit ? <>Deposit {showingDeposit.toUpperCase()} to <b>{depositAddress[showingDeposit]}</b></> : null}
                        </div>
                    </div>
                </div>

                {error ? <p className="red">{error}</p> : null}

                <div className="block deposits">
                    <div className="deposits--title">
                        <h3>Deposits</h3>
                        <button disabled={checking} className="button--white" onClick={onRefresh}>{checking ? <div className="checking"><Loading /></div> : <>Refresh</>}</button>
                    </div>
                    {utxos.filter(utxo => !utxoToMessage.has(utxo.txHash)).map((utxo) => {
                        const redeemingUTXO = redeemedUTXOs.contains(utxo.txHash);
                        return <div key={utxo.txHash} className={`utxo ${redeemingUTXO ? "utxo--redeemed" : ""}`} >
                            {showCircle(33)}
                            <div className="utxo--right">
                                <span>Deposited <b>{utxo.amount / (10 ** 8)} BTC</b>{redeemingUTXO ? <>{" "}<span className="tag">REDEEMING</span></> : null}</span>
                                <a rel="noreferrer" target="_blank" href={`https://live.blockcypher.com/btc-testnet/tx/${utxo.txHash}`}>
                                    <span className="utxo--txid">{utxo.txHash}</span>
                                </a>
                            </div>
                            <div className="utxo--buttons">
                                {!redeemingUTXO ? <button disabled={redeeming} className="button" onClick={onRedeem}>{redeeming ? <Loading alt={true} /> : <>Send to darknodes</>}</button> : null}
                            </div>
                        </div>;
                    })}
                    {renVMMessages.map((renVMMessage, time) => {
                        // const first = renVMMessage.first(undefined);
                        const loading = signatures.has(time) ? redeemingOnEthereum.get(time) : checkingResponse.get(time);
                        const messageUtxos = messageToUtxos.get(time);
                        const value = messageUtxos ? messageUtxos.reduce((sum, utxo) => utxo.amount + sum, 0) : 0;
                        return <div className="utxo" key={time}>
                            {showCircle(66)}
                            <div className="utxo--right">
                                <span>Deposited <b>{value / (10 ** 8)} BTC</b></span>
                                <span className="utxo--txid">Sent to <b>{renVMMessage.size} darknodes</b></span>
                                {/* <span className="utxo--txid">{first ? first.messageID : ""}</span> */}
                                <span className="utxo--txid">{time}</span>
                            </div>
                            <div className="utxo--buttons">
                                {signatures.has(time) ?
                                    <>
                                        {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                                        <button className="button" onClick={() => { redeemOnEthereum(time).catch(console.error); }} disabled={loading}>{loading ? <Loading /> : <>Redeem on Ethereum</>}</button>
                                    </>
                                    :
                                    <>
                                        {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                                        <button className="button--white" onClick={() => { checkForResponse(time).catch(console.error); }} disabled={loading}>{loading ? <Loading /> : <>Check for response</>}</button>
                                    </>
                                }
                            </div>
                        </div>;
                    }).toList()}
                </div>
            </> : null}
    </div >;
};

const mapStateToProps = (state: ApplicationData) => ({
    store: {
        ethereumAddress: state.general.ethereumAddress,
        redeemedUTXOs: state.general.redeemedUTXOs,
        darknodeGroup: state.general.darknodeGroup,
        renVMMessages: state.general.renVMMessages,
        utxoToMessage: state.general.utxoToMessage,
        messageToUtxos: state.general.messageToUtxos,
        signatures: state.general.signatures,
    }
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        setEthereumAddress,
        addToRedeemedUTXOs,
        addToRenVMMessages,
        addToSignatures,
        addToUtxoToMessage,
        addToMessageToUtxos,
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
}

export const SwapController = connect(mapStateToProps, mapDispatchToProps)(SwapControllerClass);
