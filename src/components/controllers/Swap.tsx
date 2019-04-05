import { Loading } from "@renex/react-components";
import * as React from "react";
import { createTestnetAddress, getTestnetUTXOs, UTXO } from "../../lib/btc/btc";

export const Swap = () => {
    const [error, setError] = React.useState<string | undefined>(undefined);
    const [address, setAddress] = React.useState<string | undefined>("0x5Ea5F67cC958023F2da2ea92231d358F2a3BbA47");
    const [depositAddress, setDepositAddress] = React.useState<string | undefined>(undefined);
    const [checking, setChecking] = React.useState(false);
    const [utxos, setUTXOs] = React.useState<UTXO[]>([]);
    const [redeeming, setRedeeming] = React.useState(false);

    const onChange = (event: React.FormEvent<HTMLInputElement>) => {
        const element = (event.target as HTMLInputElement);
        const value = element.value;
        setAddress(value);
        setDepositAddress(undefined);
    };

    const onGenerateAddress = () => {
        setError(undefined);
        setUTXOs([]);
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

    const onSubmit = async () => {
        if (!depositAddress) {
            setError(`No deposit address defined.`);
            return;
        }

        setChecking(true);
        setError(undefined);
        try {
            const newUTXOs = await getTestnetUTXOs("2N8TaSkY3cn5M2JF7tbR6UMBKjwBMtmt1aS", 10, 0);
            setUTXOs(newUTXOs);
        } catch (err) {
            setError(`${error && error.toString ? error.toString() : error}`);
        }
        setChecking(false);
    };

    const onRedeem = () => {
        setRedeeming(true);
        setTimeout(() => {
            setRedeeming(false);
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
                        Deposit to: <input type="text" value={depositAddress} />
                    </div>
                    <button disabled={checking} className="button--white" onClick={onSubmit}>{checking ? <div className="checking"><Loading /> Retriving deposits...</div> : <>Check for deposits</>}</button>
                </> :
                null
            }
        </div>

        {utxos.length > 0 ?
            <div className="swap--inner">
                <h3>Deposits found:</h3>
                {utxos.map((utxo) =>
                    <div key={utxo.txHash}>
                        <p>Transferred {utxo.amount / (10 ** 8)} BTC</p>
                    </div>
                )}
                <button disabled={redeeming} className="button--blue" onClick={onRedeem}>{redeeming ? <div className="checking"><Loading /> Pretending to do stuff...</div> : <>Redeem</>}</button>
            </div> :
            null
        }
    </div >;
};
