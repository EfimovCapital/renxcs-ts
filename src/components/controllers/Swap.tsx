import { Loading } from "@renex/react-components";
import * as React from "react";
import { createTestnetAddress } from "../../lib/btc/btc";

export const Swap = () => {
    const [error, setError] = React.useState(undefined as string | undefined);
    const [address, setAddress] = React.useState(undefined as string | undefined);
    const [depositAddress, setDepositAddress] = React.useState(undefined as string | undefined);
    const [checking, setChecking] = React.useState(false);

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
        setChecking(true);
        setTimeout(() => {
            setChecking(false);
        }, 2000);
    };

    return <div className="swap container">
        <div className="swap--inner">
            <div>
                Enter address to receive to:{" "}
                <input type="text" value={address} onChange={onChange} />
            </div>
            {error ? <p className="red">{error}</p> : null}

            <button disabled={!address} className="button" onClick={onGenerateAddress}>Generate deposit address</button>

            {depositAddress ?
                <>
                    <div>
                        Deposit to: <input type="text" value={depositAddress} disabled={true} />
                    </div>
                    <button disabled={checking} className="button--white" onClick={onSubmit}>{checking ? <div className="checking"><Loading /> Pretending to do stuff...</div> : <>Check for deposits</>}</button>
                </> :
                null
            }
        </div>
    </div >;
};
