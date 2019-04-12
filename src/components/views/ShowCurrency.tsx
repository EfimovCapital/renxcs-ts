import * as React from "react";

import { TokenIcon } from "@renex/react-components";
import { Currency, DepositAddresses } from "../../lib/blockchain/depositAddresses";

interface Props {
    currency: Currency;
    index: number;
    depositAddresses: DepositAddresses;
}

export const ShowCurrency = ({ currency, index, depositAddresses }: Props): JSX.Element => {
    const [expanded, setExpanded] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>(undefined);
    // tslint:disable-next-line: prefer-const
    let [balance, setBalance] = React.useState<string | undefined>(undefined);
    const ref = React.useRef(null as HTMLDivElement | null);

    const clickAway: EventListener = (event) => {
        if ((ref.current && !ref.current.contains(event.target as Node))) {
            setExpanded(false);
            setError(undefined);
            document.removeEventListener("mousedown", clickAway, false);
        }
    };

    const showDeposit = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!expanded) {
            setExpanded(true);
            document.addEventListener("mousedown", clickAway);
            const parent = e.currentTarget.parentElement;
            if (parent) {
                parent.scrollTo({ left: (150 + 20) * index - 10 });
            }
            setTimeout(() => {
                if (parent) {
                    parent.scrollTo({ left: (150 + 20) * index - 10 });
                }
            }, 300);
            balance = await depositAddresses.getBalance(currency);
            setBalance(balance);
        }
    };

    const burn = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (balance && balance !== "0") {
            try {
                const to = prompt(`Enter recipient ${currency.toUpperCase()} address`);
                if (!to) {
                    throw new Error(`Address must not be empty`);
                }
                await depositAddresses.burn(currency, to, balance);
            } catch (error) {
                setError(`${error && error.toString ? error.toString() : error}`);
            }
        }
    };

    return <div ref={ref} className={`currency ${currency} ${expanded ? "active" : ""}`} data-id={currency} data-index={index} onMouseDown={showDeposit} role="button" key={currency}>
        <TokenIcon token={currency.toUpperCase()} />
        {expanded ?
            <div className={`deposit-address ${currency}`}>
                <div>
                    <span>Balance: {balance} {currency.toUpperCase()}{balance && balance !== "0" ? <>{" "}(<a role="button" href="null" onClick={burn}>Burn</a>)</> : null}</span><br />
                    {error ? <><span className="red">{error}</span><br /></> : null}
                    <span>Deposit to <b>{depositAddresses.depositAddresses.get(currency)}</b></span>
                </div>
            </div>
            : null}
    </div>;
};
