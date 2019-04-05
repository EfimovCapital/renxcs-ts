import * as React from "react";

import Web3 from "web3";

import { Loading } from "@renex/react-components";
import { connect, ConnectedReturnType } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";

import { createTestnetAddress, getTestnetUTXOs, UTXO } from "../../lib/btc/btc";
import { addToRedeemedUTXOs, setEthereumAddress } from "../../store/actions/general/generalActions";
import { ApplicationData } from "../../store/types/general";

import { ReactComponent as MetaMask } from "../../styles/images/metamask.svg";

declare global {
    interface Window {
        // tslint:disable-next-line: no-any
        ethereum: any;
        // tslint:disable-next-line: no-any
        web3: any;
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

export const SwapControllerClass = (props: Props) => {
    const { store: { ethereumAddress, redeemedUTXOs } } = props;

    const [mounted, setMounted] = React.useState(false);

    const [error, setError] = React.useState<string | undefined>(undefined);
    const [depositAddress, setDepositAddress] = React.useState<string | undefined>(undefined);
    const [checking, setChecking] = React.useState(false);
    const [utxos, setUTXOs] = React.useState<UTXO[]>([]);
    const [redeeming, setRedeeming] = React.useState(false);

    const onChange = (event: React.FormEvent<HTMLInputElement>) => {
        const element = (event.target as HTMLInputElement);
        const value = element.value;
        props.actions.setEthereumAddress(value);
        setDepositAddress(undefined);
        setUTXOs([]);
    };

    const onGenerateAddress = () => {
        setError(undefined);
        setUTXOs([]);
        if (ethereumAddress) {
            let btcAddress;
            try {
                btcAddress = createTestnetAddress(ethereumAddress);
            } catch (error) {
                setError(`${error && error.toString ? error.toString() : error}`);
                return;
            }
            setDepositAddress(btcAddress);
        }
    };

    if (!mounted && ethereumAddress && ethereumAddress.length === 42 && !depositAddress) {
        onGenerateAddress();
    }

    if (!mounted) {
        setMounted(true);
    }

    const onSubmit = async () => {
        if (!depositAddress) {
            setError(`No deposit address defined.`);
            return;
        }

        setChecking(true);
        setError(undefined);
        try {
            const newUTXOs = await getTestnetUTXOs(depositAddress, 10, 0);
            setUTXOs(newUTXOs);
        } catch (error) {
            setError(`${error && error.toString ? error.toString() : error}`);
        }
        setChecking(false);
    };

    const onRedeem = () => {
        setRedeeming(true);

        setTimeout(() => {
            for (const utxo of utxos) {
                props.actions.addToRedeemedUTXOs(utxo.txHash);
            }
            setRedeeming(false);
        }, 2000);
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

    const showRedeemButton = utxos.reduce<boolean>((carry, e) => carry || !redeemedUTXOs.contains(e.txHash), false);

    return <div className="swap container">
        <div className="swap--inner">
            <div>
                Enter address to receive to:{" "}
                <div className="swap--eth--input">
                    <input type="text" value={ethereumAddress} onChange={onChange} />
                    <button className="metamask-logo" onClick={getMetaMaskAddress}><MetaMask /></button>
                </div>
            </div>
            {error ? <p className="red">{error}</p> : null}

            <button disabled={!ethereumAddress} className="button" onClick={onGenerateAddress}>Generate deposit address</button>

            {depositAddress ?
                <>
                    <div>
                        Deposit to: <input type="text" value={depositAddress} />
                    </div>
                    <button disabled={checking} className="button--white" onClick={onSubmit}>{checking ? <div className="checking"><Loading /> Retriving deposits...</div> : <>Check for deposits</>}</button>
                </> :
                null
            }
        </div>

        {utxos.length > 0 ?
            <div className="swap--inner">
                <h3>Deposits found:</h3>
                {utxos.map((utxo) => {
                    const redeemingUTXO = redeemedUTXOs.contains(utxo.txHash);
                    return <a key={utxo.txHash} className={`utxo ${redeemingUTXO ? "utxo--redeemed" : ""}`} rel="noreferrer" target="_blank" href={`https://live.blockcypher.com/btc-testnet/tx/${utxo.txHash}`}>
                        <span>Deposited <b>{utxo.amount / (10 ** 8)} BTC</b>{redeemingUTXO ? <>{" "}<span className="tag">REDEEMING</span></> : null}</span>
                        <span className="utxo--txid">{utxo.txHash}</span>
                    </a>;
                })}
                {showRedeemButton ?
                    <button disabled={redeeming} className="button" onClick={onRedeem}>{redeeming ? <div className="checking"><Loading alt={true} /> Pretending to do stuff...</div> : <>Redeem</>}</button> :
                    null
                }
            </div> :
            null
        }
    </div >;
};

const mapStateToProps = (state: ApplicationData) => ({
    store: {
        ethereumAddress: state.general.ethereumAddress,
        redeemedUTXOs: state.general.redeemedUTXOs,
    }
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actions: bindActionCreators({
        setEthereumAddress,
        addToRedeemedUTXOs,
    }, dispatch)
});

interface Props extends ReturnType<typeof mapStateToProps>, ConnectedReturnType<typeof mapDispatchToProps> {
}

export const SwapController = connect(mapStateToProps, mapDispatchToProps)(SwapControllerClass);
