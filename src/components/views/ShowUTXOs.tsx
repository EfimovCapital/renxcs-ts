import * as React from "react";

import { Loading } from "@renex/react-components";
import { Map, OrderedMap } from "immutable";

import { Deposit, XCSEvent } from "../../store/types/general";
import { ShowUTXO } from "./ShowUTXO";

// TODO: Refactor props
interface Props {
    checking: boolean;
    redeeming: Map<string, boolean>;
    events: OrderedMap<string, XCSEvent>;
    checkingResponse: Map<string, boolean>;
    onRefresh: () => Promise<void>;
    onRedeem: (deposit: Deposit) => Promise<void>;
    checkForResponse: (id: string) => Promise<void>;
}

export const ShowUTXOs = ({ checking, onRefresh, events, redeeming, onRedeem, checkingResponse, checkForResponse }: Props) => {
    // let redeemable = Map<Currency, string>();
    // for (const currency of CurrencyList) {
    //     const first = unredeemed.filter(utxo => utxo.currency === currency).first(undefined);
    //     if (first) {
    //         redeemable = redeemable.set(currency, first.utxo.txHash)
    //     }
    // }
    return <div className="block deposits">
        <div className="deposits--title">
            <h3>History (all addresses)</h3>
            <button disabled={checking} className="button--white" onClick={onRefresh}>{checking ? <div className="checking"><Loading /></div> : <>Refresh</>}</button>
        </div>

        {events.reverse().map(event => {
            // const last = redeemable.contains(utxo.utxo.txHash);
            return <ShowUTXO event={event} key={event.id} last={true} redeeming={redeeming.get(event.id) || false} onRedeem={onRedeem} checkingResponse={checkingResponse} checkForResponse={checkForResponse} />;
        }).toList()}
    </div>;
};
