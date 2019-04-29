import * as React from "react";

import CircularProgressBar from "react-circular-progressbar";

import { Loading } from "@renex/react-components";
import { Map } from "immutable";

import { Currency, CurrencyDecimals } from "../../lib/blockchain/depositAddresses";
import { Burn, Deposit, EventType, Mint, XCSEvent } from "../../store/types/general";

import "react-circular-progressbar/dist/styles.css";

const showCircle = (percentage: number, color?: string) => {
    return <CircularProgressBar
        className="circle--progress"
        percentage={percentage}
        strokeWidth={18}
        styles={{
            path: {
                stroke: color || "#006FE8",
                strokeLinecap: "butt",
                // strokeOpacity: 0.6,
            },
            trail: {
                stroke: color || "#006FE8",
                strokeOpacity: 0.2,
            },
        }}
    />;
};

export interface Props {
    event: XCSEvent;
    redeeming: boolean;
    checkingResponse: Map<string, boolean>;
    oldestDeposit: boolean;

    onRedeem: (deposit: Deposit) => void;
    checkForResponse: (id: string) => Promise<void>;
}

export const ShowUTXO = (props: Props) => {
    if (props.event.type === EventType.Deposit) {
        const event = props.event as Deposit;
        const { oldestDeposit, redeeming, onRedeem } = props;
        const onClick = () => {
            onRedeem(event);
        };
        const utxo = event.utxo.first(undefined);
        if (!utxo) {
            return <div className="utxo">Invalid deposit: {JSON.stringify(props.event, null, "    ")}</div>;
        }
        const value = utxo.amount;
        return <div className="utxo">
            {showCircle(33)}
            <div className="utxo--right">
                <span>Deposited <b>{value / (10 ** CurrencyDecimals(event.currency))} {event.currency.toUpperCase()}</b></span>
                <a rel="noreferrer" target="_blank" href={`https://live.blockcypher.com/btc-testnet/tx/${event.id}`}>
                    <span className="utxo--txid">{event.id}</span>
                </a>
            </div>
            <div className="utxo--buttons">
                {oldestDeposit ? <button disabled={redeeming} className="button--blue" onClick={onClick}>{redeeming ? <Loading alt={true} /> : <>Send to darknodes</>}</button> : null}
            </div>
        </div>;
    } else if (props.event.type === EventType.Mint) {
        const event = props.event as Mint;
        const { checkingResponse, checkForResponse } = props;
        // const first = renVMMessage.first(undefined);
        const loading = checkingResponse.get(event.id);
        let values = Map<Currency, number>();
        event.utxos.map(utxo => {
            const value = utxo.utxo.amount;
            const previousValue = values.get(utxo.currency) || 0;
            values = values.set(utxo.currency, previousValue + value);
        });
        const valuesString = values.map((value, currency) => {
            return `${value / (10 ** CurrencyDecimals(currency))} ${currency.toUpperCase()}`;
        }).join(", ");
        return <div className={`utxo ${event.mintTransaction ? "done" : ""}`}>
            {showCircle(event.mintTransaction ? 100 : 66)}
            <div className="utxo--right">
                <span>Deposited <b>{valuesString}</b></span>
                <span className="utxo--txid">{event.mintTransaction ? <>Redeemed ({event.mintTransaction}).</> : <>Sent to <b>{event.messageIDs.size} lightnodes</b>. Awaiting response.</>}</span>
                {/* <span>
                                    {messageUtxos ? messageUtxos.map(utxo => <span key={utxo.txHash} className="utxo--txid">{utxo.txHash.slice(0, 8)}...</span>).toArray() : null}
                                </span> */}
                {/* <span className="utxo--txid">{first ? first.messageID : ""}</span> */}
                {/* <span className="utxo--txid">{time}</span> */}
            </div>
            {event.mintTransaction ?
                <div className="utxo--buttons">
                    {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                    {/* <button className="button--blue" onClick={() => { redeemOnEthereum(time).catch(console.error); }} disabled={loading}>{loading ? <Loading /> : <>Redeem on Ethereum</>}</button> */}
                </div>
                :
                <>
                    <div className="utxo--buttons">
                        {/* tslint:disable-next-line: react-this-binding-issue jsx-no-lambda */}
                        <button className="button--white" onClick={() => { checkForResponse(event.id).catch(console.error); }} disabled={loading}>{loading ? <Loading /> : <>Check for response</>}</button>
                    </div>
                </>
            }
        </div>;
    } else if (props.event.type === EventType.Burn) {
        const event = props.event as Burn;
        return <div className={`utxo done`} >
            {showCircle(100, "#F16262")}
            <div className="utxo--right">
                <span>Burned <b>{event.amount} {event.currency.toUpperCase()}</b></span>
                {/* <a rel="noreferrer" target="_blank" href={`https://live.blockcypher.com/btc-testnet/tx/${event.id}`}>
                    <span className="utxo--txid">{event.id}</span>
                </a> */}
            </div>
        </div>;
    } else {
        return <div className="utxo">
            Invalid event: {JSON.stringify(props.event, null, "    ")}
        </div>;
    }
};
