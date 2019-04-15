import * as React from "react";

import { Currency, CurrencyList, DepositAddresses } from "../../lib/blockchain/depositAddresses";
import { ShowCurrency } from "./ShowCurrency";

export const CurrenciesBlock = ({ burn, depositAddresses }: { burn: (currency: Currency, amount: string) => Promise<void>, depositAddresses: DepositAddresses }) => {
    return <div className="block">
        <h3>Currencies</h3>
        <div className="currencies">
            {CurrencyList.map((currency, index) => {
                return <ShowCurrency burn={burn} key={currency} currency={currency} index={index} depositAddresses={depositAddresses} />;
            })}
        </div>
    </div >;
};
