import * as React from "react";

import { TokenIcon } from "@renex/react-components";

import { Currency, DepositAddresses } from "../../lib/blockchain/blockchain";

export const CurrenciesBlock = ({ depositAddresses }: { depositAddresses: DepositAddresses }) => {
    const [showingDeposit, setShowingDeposit] = React.useState<Currency | undefined>();

    const hideDeposit = (): void => {
        setShowingDeposit(undefined);
    };

    const showDeposit = (e: React.MouseEvent<HTMLDivElement>): void => {
        const id = e.currentTarget.dataset ? e.currentTarget.dataset.id : undefined;
        if (id) {
            if (id === showingDeposit) {
                hideDeposit();
            } else {
                setShowingDeposit(id as Currency);
            }
        }
    };

    return <div className="block">
        <h3>Currencies</h3>
        <div className="currencies">
            {[Currency.BTC, Currency.ZEC, Currency.ETH].map((currency) => {
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
                {showingDeposit ? <>Deposit {showingDeposit.toUpperCase()} to <b>{depositAddresses.depositAddresses.get(showingDeposit)}</b></> : null}
            </div>
        </div>
    </div>;
};
