import * as React from "react";

import { Loading } from "@renex/react-components";
import { List, Map } from "immutable";

import { UTXO } from "../../lib/blockchain/depositAddresses";
import { MultiAddress } from "../../lib/types/types";
import { ShowUTXO } from "./ShowUTXO";

// TODO: Refactor props
interface Props {
    checking: boolean;
    onRefresh: () => Promise<void>;
    utxos: List<UTXO>;
    utxoToMessage: Map<string, string>;
    // tslint:disable-next-line: no-any
    redeemedUTXOs: any;
    redeeming: boolean;
    onRedeem: (utxo: UTXO) => Promise<void>;
    renVMMessages: Map<string, List<{
        messageID: string;
        multiAddress: MultiAddress;
    }>>;
    signatures: Map<string, string>;
    redeemingOnEthereum: Map<string, boolean>;
    checkingResponse: Map<string, boolean>;
    messageToUtxos: Map<string, List<UTXO>>;
    redeemOnEthereum: (id: string) => Promise<void>;
    checkForResponse: (id: string) => Promise<void>;
    resubmitting: Map<string, boolean>;
}

export const ShowUTXOs = ({ checking, onRefresh, utxos, utxoToMessage, redeemedUTXOs, redeeming, onRedeem, renVMMessages, signatures, redeemingOnEthereum, checkingResponse, messageToUtxos, redeemOnEthereum, checkForResponse, resubmitting }: Props) => {
    const unredeemed = utxos.filter(utxo => !utxoToMessage.has(utxo.utxo.txHash));
    const redeemable = unredeemed.first(undefined);
    return <div className="block deposits">
        <div className="deposits--title">
            <h3>Deposits</h3>
            <button disabled={checking} className="button--white" onClick={onRefresh}>{checking ? <div className="checking"><Loading /></div> : <>Refresh</>}</button>
        </div>
        {unredeemed.map((utxo) => {
            const last = redeemable ? redeemable.utxo.txHash === utxo.utxo.txHash : false;
            const redeemingUTXO = redeemedUTXOs.contains(utxo.utxo.txHash);
            return <ShowUTXO last={last} simple={true} key={utxo.utxo.txHash} utxo={utxo} redeemingUTXO={redeemingUTXO} redeeming={redeeming} onRedeem={onRedeem} />;
        })}
        {renVMMessages.filter((_, message) => !signatures.has(message)).map((renVMMessage, time) => {
            // const first = renVMMessage.first(undefined);
            return <ShowUTXO key={time} simple={false} signatures={signatures} redeemingOnEthereum={redeemingOnEthereum} checkingResponse={checkingResponse} time={time} renVMMessage={renVMMessage} messageToUtxos={messageToUtxos} redeemOnEthereum={redeemOnEthereum} checkForResponse={checkForResponse} resubmitting={resubmitting} />;
        }).toList()}
        {renVMMessages.filter((_, message) => signatures.has(message)).map((renVMMessage, time) => {
            // const first = renVMMessage.first(undefined);
            return <ShowUTXO key={time} simple={false} signatures={signatures} redeemingOnEthereum={redeemingOnEthereum} checkingResponse={checkingResponse} time={time} renVMMessage={renVMMessage} messageToUtxos={messageToUtxos} redeemOnEthereum={redeemOnEthereum} checkForResponse={checkForResponse} resubmitting={resubmitting} />;
        }).toList()}
    </div>;
}
