import * as React from "react";

import Web3 from "web3";

import { List, Map } from "immutable";
import { connect, ConnectedReturnType } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { HttpProvider } from "web3-providers";

import { DepositAddresses, UTXO } from "../../lib/blockchain/depositAddresses";
import { addToMessageToUtxos, addToRedeemedUTXOs, addToRenVMMessages, addToSignatures, addToUtxoToMessage, setEthereumAddress } from "../../store/actions/general/generalActions";
import { ApplicationData } from "../../store/types/general";
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
    const { store: { ethereumAddress, redeemedUTXOs, darknodeGroup, renVMMessages, signatures, utxoToMessage, messageToUtxos } } = props;

    const [mounted, setMounted] = React.useState(false);

    const [error, setError] = React.useState<string | undefined>(undefined);
    // tslint:disable-next-line: prefer-const
    let [depositAddresses, setDepositAddresses] = React.useState<DepositAddresses | undefined>(undefined);
    const [checking, setChecking] = React.useState(false);
    const [utxos, setUTXOs] = React.useState<List<UTXO>>(List());
    // tslint:disable-next-line: prefer-const
    let [redeeming, setRedeeming] = React.useState(Map<string, boolean>());
    const [blur, setBlur] = React.useState(false);
    // tslint:disable-next-line: prefer-const
    let [checkingResponse, setCheckingResponse] = React.useState(Map<string, boolean>());
    const [redeemingOnEthereum, setRedeemingOnEthereum] = React.useState(Map<string, boolean>());

    const onChange = (event: React.FormEvent<HTMLInputElement>) => {
        const element = (event.target as HTMLInputElement);
        const value = element.value;
        props.actions.setEthereumAddress(value);
        // setDepositAddresses(undefined);
        // setUTXOs(List());
        setBlur(true);
    };

    const checkForResponse = async (id: string) => {
        const renVMMessage = renVMMessages.get(id);
        if (!renVMMessage) {
            return;
        }
        checkingResponse = checkingResponse.set(id, true);
        setCheckingResponse(checkingResponse);
        try {
            const signature = await darknodeGroup.checkForResponse(renVMMessage);
            props.actions.addToSignatures({ utxo: id, signature });
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

        const promises = renVMMessages.map(async (_, time) => {
            // tslint:disable-next-line: no-console
            return checkForResponse(time).catch(console.error);
        }).valueSeq().toArray();

        const newUtxos = await depositAddresses.getUTXOs();
        setUTXOs(newUtxos);

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

        if (ethereumAddress) {
            if (depositAddresses && depositAddresses.receiveAddress === ethereumAddress) {
                // do nothing
            } else {
                setUTXOs(List());
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

    const onRedeem = async (utxo: UTXO) => {
        redeeming = redeeming.set(utxo.utxo.txHash, true);
        setRedeeming(redeeming);
        if (!ethereumAddress) {
            return;
        }

        const id = utxo.utxo.txHash;

        try {
            const messages = await darknodeGroup.submitDeposits(ethereumAddress, utxo);
            props.actions.addToRenVMMessages({ utxo: id, messages });
            props.actions.addToMessageToUtxos({ message: id, utxos: List([utxo]) });
            props.actions.addToRedeemedUTXOs(utxo.utxo.txHash);
            props.actions.addToUtxoToMessage({ utxo: utxo.utxo.txHash, message: id });
        } catch (error) {
            console.error(error);
            setError(`${error && error.toString ? error.toString() : error}`);
        }

        redeeming = redeeming.remove(utxo.utxo.txHash);
        setRedeeming(redeeming);
    };

    const getMetaMaskAddress = async () => {
        try {
            const web3 = await getWeb3();
            const addresses = await web3.eth.getAccounts();
            props.actions.setEthereumAddress(addresses[0]);
            setBlur(true);
        } catch (error) {
            setError(`${error && error.toString ? error.toString() : error}`);
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
        <ReceiveAddress onGenerateAddress={onGenerateAddress} ethereumAddress={ethereumAddress} onChange={onChange} getMetaMaskAddress={getMetaMaskAddress} />
        {error ? <p className="red">{error}</p> : null}
        {depositAddresses ?
            <div className={`swap--bottom ${blur ? "blur" : ""}`}>
                <CurrenciesBlock depositAddresses={depositAddresses} />
                <ShowUTXOs checking={checking} onRefresh={onRefresh} utxos={utxos} utxoToMessage={utxoToMessage} redeemedUTXOs={redeemedUTXOs} redeeming={redeeming} onRedeem={onRedeem} renVMMessages={renVMMessages} signatures={signatures} redeemingOnEthereum={redeemingOnEthereum} checkingResponse={checkingResponse} messageToUtxos={messageToUtxos} redeemOnEthereum={redeemOnEthereum} checkForResponse={checkForResponse} />
            </div> : null}
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
