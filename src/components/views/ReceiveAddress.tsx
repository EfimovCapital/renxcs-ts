import * as React from "react";

import { ReactComponent as MetaMask } from "../../styles/images/metamask.svg";

interface Props {
    // tslint:disable-next-line: no-any
    onGenerateAddress: () => void;
    ethereumAddress: string | undefined;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    getMetaMaskAddress: () => Promise<void>;
}

export const ReceiveAddress = ({ onGenerateAddress, ethereumAddress, onChange, getMetaMaskAddress }: Props) => {
    const ref = React.useRef(null as HTMLButtonElement | null);

    const onGetMM = async () => {
        if (ref.current) {
            ref.current.focus();
        }
        await getMetaMaskAddress();
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onGenerateAddress();
    };

    return <div className="block">
        <form onSubmit={onSubmit} className="swap--eth--form">
            <div className="swap--eth--input">
                <input type="text" value={ethereumAddress} onChange={onChange} placeholder="Enter Ethereum address for receiving" />
                <button type="button" className="metamask-logo" onClick={onGetMM}><MetaMask /></button>
                <button ref={ref} type="submit" className="button--white swap--eth--submit" disabled={!ethereumAddress}>Go</button>
            </div>
        </form>
    </div>;
};
