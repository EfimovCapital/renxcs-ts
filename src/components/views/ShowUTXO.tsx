import * as React from "react";

import CircularProgressBar from "react-circular-progressbar";

import { Loading } from "@renex/react-components";
import { List, Map } from "immutable";

import { UTXO } from "../../lib/blockchain/depositAddresses";

import "react-circular-progressbar/dist/styles.css";
import { MultiAddress } from "../../lib/types/types";

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

export type Props = {
    simple: true,
    utxo: UTXO,
    redeemingUTXO: boolean,
    redeeming: boolean,
    onRedeem: () => void;
} | {
    simple: false,
    // tslint:disable-next-line: no-any
    time: any,
    renVMMessage: List<{
        messageID: string;
        multiAddress: MultiAddress;
    }>,
    signatures: Map<string, string>;
    redeemingOnEthereum: Map<string, boolean>;
    checkingResponse: Map<string, boolean>;
    messageToUtxos: Map<string, List<UTXO>>;
    redeemOnEthereum: (id: string) => Promise<void>;
    resendMessage: (time: string) => Promise<void>;
    checkForResponse: (id: string) => Promise<void>;
    resubmitting: Map<string, boolean>;
};

export const ShowUTXO = (props: Props) => {
    if (props.simple) {
        const { utxo, redeemingUTXO, redeeming, onRedeem } = props;
        return <div className={`utxo ${redeemingUTXO ? "utxo--redeemed" : ""}`} >
            {showCircle(33)}
            <div className="utxo--right">
                <span>Deposited <b>{utxo.utxo.amount / (10 ** 8)} {utxo.currency.toUpperCase()}</b>{redeemingUTXO ? <>{" "}<span className="tag">REDEEMING</span></> : null}</span>
                <a rel="noreferrer" target="_blank" href={`https://live.blockcypher.com/btc-testnet/tx/${utxo.utxo.txHash}`}>
                    <span className="utxo--txid">{utxo.utxo.txHash}</span>
                </a>
            </div>
            <div className="utxo--buttons">
                {!redeemingUTXO ? <button disabled={redeeming} className="button--blue" onClick={onRedeem}>{redeeming ? <Loading alt={true} /> : <>Send to darknodes</>}</button> : null}
            </div>
        </div>;
    } else {
        const { signatures, redeemingOnEthereum, checkingResponse, time, renVMMessage, messageToUtxos, redeemOnEthereum, resendMessage, checkForResponse, resubmitting } = props;
        // const first = renVMMessage.first(undefined);
        const loading = signatures.has(time) ? redeemingOnEthereum.get(time) : checkingResponse.get(time);
        const messageUtxos = messageToUtxos.get(time);
        console.log(messageUtxos);
        const value = messageUtxos ? messageUtxos.reduce((sum: number, utxo: UTXO) => utxo.utxo.amount + sum, 0) : 0;
        return <div className="utxo">
            {showCircle(66)}
            <div className="utxo--right">
                <span>Deposited <b>{value / (10 ** 8)} BTC</b></span>
                <span className="utxo--txid">Sent to <b>{renVMMessage.size} darknodes</b>. Awaiting response.</span>
                {/* <span>
                                    {messageUtxos ? messageUtxos.map(utxo => <span key={utxo.txHash} className="utxo--txid">{utxo.txHash.slice(0, 8)}...</span>).toArray() : null}
                                </span> */}
                {/* <span className="utxo--txid">{first ? first.messageID : ""}</span> */}
                {/* <span className="utxo--txid">{time}</span> */}
            </div>
            {signatures.has(time) ?
                <div className="utxo--buttons">
                    {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                    <button className="button--blue" onClick={() => { redeemOnEthereum(time).catch(console.error); }} disabled={loading}>{loading ? <Loading /> : <>Redeem on Ethereum</>}</button>
                </div>
                :
                <>
                    <div className="utxo--buttons">

                        {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                        <button className="button--white" onClick={() => { resendMessage(time).catch(console.error); }} disabled={resubmitting.has(time)}>{resubmitting.has(time) ? <Loading /> : <>Resend ren_sendMessage</>}</button>
                    </div>
                    <div className="utxo--buttons">
                        {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                        <button className="button--white" onClick={() => { checkForResponse(time).catch(console.error); }} disabled={loading}>{loading ? <Loading /> : <>Check for response</>}</button>
                    </div>
                </>
            }
        </div>;
    }
};
