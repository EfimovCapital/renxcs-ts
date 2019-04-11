import * as React from "react";

import { TokenIcon } from "@renex/react-components";

import { Currency, DepositAddresses } from "../../lib/blockchain/depositAddresses";

export const CurrenciesBlock = ({ depositAddresses }: { depositAddresses: DepositAddresses }) => {
    const [showingDeposit, setShowingDeposit] = React.useState<Currency | undefined>();
    // tslint:disable-next-line: prefer-const
    let [balance, setBalance] = React.useState<string | undefined>(undefined);

    const hideDeposit = (): void => {
        setShowingDeposit(undefined);
    };

    const showDeposit = async (e: React.MouseEvent<HTMLDivElement>) => {
        const id = e.currentTarget.dataset ? e.currentTarget.dataset.id : undefined;
        if (id) {
            if (id === showingDeposit) {
                hideDeposit();
            } else {
                setBalance("0");
                setShowingDeposit(id as Currency);
                balance = await depositAddresses.getBalance(id as Currency);
                setBalance(balance);
            }
        }
    };

    const preventDefault = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
    };

    return <div className="block">
        <h3>Currencies</h3>
        <div className="currencies">
            {[Currency.BTC, Currency.ZEC, Currency.ETH].map((currency) => {
                return <div
                    className={`currency ${currency} ${showingDeposit === currency ? "active" : ""}`}
                    data-id={currency}
                    onClick={showDeposit}
                    role="button"
                    key={currency}
                >
                    <TokenIcon token={currency.toUpperCase()} />
                    {showingDeposit === currency ?
                        <div className={`deposit-address ${currency}`}>
                            <div>
                                <span>Balance: {balance} {currency.toUpperCase()}</span><br />
                                <span role="button" onClick={preventDefault}>Deposit to <b>{depositAddresses.depositAddresses.get(currency)}</b></span>
                            </div>
                        </div>
                        : null}
                </div>;
            })}
        </div>
    </div>;
};