import * as React from "react";

import { CurrencyList, DepositAddresses } from "../../lib/blockchain/depositAddresses";
import { ShowCurrency } from "./ShowCurrency";

export const CurrenciesBlock = ({ depositAddresses }: { depositAddresses: DepositAddresses }) => {
    return <div className="block">
        <h3>Currencies</h3>
        <div className="currencies">
            {CurrencyList.map((currency, index) => {
                return <ShowCurrency key={currency} currency={currency} index={index} depositAddresses={depositAddresses} />;
            })}
        </div>
    </div >;
};
