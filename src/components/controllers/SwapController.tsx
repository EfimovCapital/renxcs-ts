import * as React from "react";

import Web3 from "web3";

import { Loading, TokenIcon } from "@renex/react-components";
import { connect, ConnectedReturnType } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { HttpProvider } from "web3-providers";

import { createTestnetAddress, getTestnetUTXOs, UTXO } from "../../lib/btc/btc";
import { addToRedeemedUTXOs, setEthereumAddress, addToRenVMMessages, addToSignatures } from "../../store/actions/general/generalActions";
import { ApplicationData } from "../../store/types/general";

import { ReactComponent as MetaMask } from "../../styles/images/metamask.svg";
import { List, Map } from "immutable";
import { MultiAddress } from "../../lib/types/types";

interface InjectedEthereum extends HttpProvider {
    enable: () => Promise<void>;
}

declare global {
    interface Window {
        ethereum?: InjectedEthereum;
        web3?: Web3;
    }
}

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
    const { store: { ethereumAddress, redeemedUTXOs, darknodeGroup, renVMMessages, signatures } } = props;

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

    const onSubmit = async (altDepositAddress?: string) => {
        altDepositAddress = altDepositAddress || (depositAddress && depositAddress.btc) || "";
        if (!altDepositAddress) {
            setError(`No deposit address defined.`);
            return;
        }

        setChecking(true);
        setError(undefined);
        try {
            const newUTXOs = await getTestnetUTXOs(altDepositAddress, 10, 0);
            setUTXOs(newUTXOs);
        } catch (error) {
            setError(`${error && error.toString ? error.toString() : error}`);
        }
        setChecking(false);
    };

    // Call onSubmit without passing in click-event parameters
    const onClickSubmit = () => onSubmit();

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

        try {
            const messages = await darknodeGroup.submitDeposits(ethereumAddress);
            props.actions.addToRenVMMessages({ utxo: Date().toString(), messages });
        } catch (error) {
            console.error(error);
            setRedeeming(false);
            setError(`${error && error.toString ? error.toString() : error}`);
            return;
        }
        for (const utxo of utxos) {
            props.actions.addToRedeemedUTXOs(utxo.txHash);
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

    const redeemOnEthereum = async (id: string) => {
        const signature = signatures.get(id);
        if (!signature) {
            return;
        }
        setRedeemingOnEthereum(redeemingOnEthereum.set(id, true));
        try {
            const web3 = await getWeb3();
        } catch (error) {
            setError(`${error && error.toString ? error.toString() : error}`);
        }
        setRedeemingOnEthereum(redeemingOnEthereum.remove(id));
    };

    const showRedeemButton = utxos.reduce<boolean>((carry, e) => carry || !redeemedUTXOs.contains(e.txHash), false);

    return <div className="swap container">
        <form onSubmit={onGenerateAddress} className="swap--eth--form">
            <div className="swap--eth--input">
                <input type="text" value={ethereumAddress} onChange={onChange} placeholder="Enter Ethereum address for receiving" />
                <button className="metamask-logo" onClick={getMetaMaskAddress}><MetaMask /></button>
                <input type="submit" className="button--white swap--eth--submit" disabled={!ethereumAddress} value="Go" />
            </div>
        </form>
        {depositAddress ?
            <>
                <div className="currencies">
                    <div
                        className="currency"
                        data-id={"btc"}
                        onClick={showDeposit}
                        role="button"
                    >
                        <TokenIcon token={"BTC"} />
                    </div>
                    <div
                        className="currency zec"
                        data-id={"zec"}
                        onClick={showDeposit}
                        role="button"
                    >
                        <TokenIcon token={"ZEC"} />
                    </div>
                    <div
                        className="currency eth"
                        data-id={"eth"}
                        onClick={showDeposit}
                        role="button"
                    >
                        <TokenIcon token={"ETH"} />
                    </div>
                </div>

                {showingDeposit ? <div className={`swap--inner ${showingDeposit}`}>
                    <div>
                        Deposit {showingDeposit.toUpperCase()} to <b>{depositAddress[showingDeposit]}</b>
                    </div>
                </div> : null}

                {error ? <p className="red">{error}</p> : null}

                <div className="deposits">
                    <button disabled={checking} className="button--white" onClick={onClickSubmit}>{checking ? <div className="checking"><Loading /> Retriving deposits...</div> : <>Retrieve deposits</>}</button>
                    {utxos.map((utxo) => {
                        const redeemingUTXO = redeemedUTXOs.contains(utxo.txHash);
                        return <a key={utxo.txHash} className={`utxo ${redeemingUTXO ? "utxo--redeemed" : ""}`} rel="noreferrer" target="_blank" href={`https://live.blockcypher.com/btc-testnet/tx/${utxo.txHash}`}>
                            <span>Deposited <b>{utxo.amount / (10 ** 8)} BTC</b>{redeemingUTXO ? <>{" "}<span className="tag">REDEEMING</span></> : null}</span>
                            <span className="utxo--txid">{utxo.txHash}</span>
                        </a>;
                    })}
                    {showRedeemButton ?
                        <button disabled={redeeming} className="button" onClick={onRedeem}>{redeeming ? <div className="checking"><Loading alt={true} /> Redeeming...</div> : <>Redeem</>}</button> :
                        null
                    }
                </div>
                
                {renVMMessages.size > 0 ?
                    <div className="deposits">
                        <h3>In progress</h3>
                        {renVMMessages.map((renVMMessage, time) => {
                            const first = renVMMessage.first(undefined);
                            const loading = signatures.has(time) ? redeemingOnEthereum.get(time) : checkingResponse.get(time);
                            return <div className="utxo" key={time}>
                                <span>Response from <b>{renVMMessage.size} darknodes</b></span>
                                <span className="utxo--txid">{first ? first.messageID : ""}</span>
                                <span className="utxo--txid">{time}</span>
                                {signatures.has(time) ?
                                    <>
                                        {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                                        <button className="button--blue" onClick={() => { redeemOnEthereum(time).catch(console.error); }} disabled={loading}>{loading ? <Loading /> : <>Redeem on Ethereum</>}</button>
                                    </>
                                    :
                                    <>
                                        {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                                        <button className="button--white" onClick={() => { checkForResponse(time).catch(console.error); }} disabled={loading}>{loading ? <Loading /> : <>Check for response</>}</button>
                                    </>
                                }
                            </div>;
                        }).toList()}
                    </div> : null
                }
            </> : null}
    </div >;
};

const mapStateToProps = (state: ApplicationData) => ({
    store: {
        ethereumAddress: state.general.ethereumAddress,
        redeemedUTXOs: state.general.redeemedUTXOs,
        darknodeGroup: state.general.darknodeGroup,
        renVMMessages: state.general.renVMMessages,
        signatures: state.general.signatures,
    }
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        setEthereumAddress,
        addToRedeemedUTXOs,
        addToRenVMMessages,
        addToSignatures,
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
}

export const SwapController = connect(mapStateToProps, mapDispatchToProps)(SwapControllerClass);
