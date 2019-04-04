import * as React from "react";
import { createTestnetAddress } from "../../lib/btc/btc";

export const Swap = () => {
    const [error, setError] = React.useState(undefined as string | undefined);
    const [address, setAddress] = React.useState(undefined as string | undefined);
    const [depositAddress, setDepositAddress] = React.useState(undefined as string | undefined);

    const onChange = (event: React.FormEvent<HTMLInputElement>) => {
        const element = (event.target as HTMLInputElement);
        const value = element.value;
        setAddress(value);
        setDepositAddress(undefined);
    };

    const onGenerateAddress = () => {
        setError(undefined);
        if (address) {
            let btcAddress;
            try {
                btcAddress = createTestnetAddress(address);
            } catch (error) {
                setError(`${error && error.toString ? error.toString() : error}`);
                return;
            }
            setDepositAddress(btcAddress);
        }
    };

    const onSubmit = () => {
        //
    };

    return <div className="swap container">
        <div className="swap--inner">
            <div>
                Enter address to receive to:{" "}
                <input type="text" value={address} onChange={onChange} />
            </div>
            {error ? <p className="red">{error}</p> : null}

            <button className="button" onClick={onGenerateAddress}>Generate deposit address</button>

            {depositAddress ?
                <>
                    <div>
                        Deposit to: <input type="text" value={depositAddress} disabled={true} />
                    </div>
                    <button className="button--white" onClick={onSubmit}>Check for deposits</button>
                </> :
                null
            }
        </div>
    </div >;
};
