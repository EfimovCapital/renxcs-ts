import * as React from "react";

import { ReactComponent as MetaMask } from "../../styles/images/metamask.svg";

interface Props {
    // tslint:disable-next-line: no-any
    onGenerateAddress: (e?: any) => void;
    ethereumAddress: string | undefined;
    onChange: (event: React.FormEvent<HTMLInputElement>) => void;
    getMetaMaskAddress: () => Promise<void>;
}

export const ReceiveAddress = ({ onGenerateAddress, ethereumAddress, onChange, getMetaMaskAddress }: Props) => <div className="block">
    <form onSubmit={onGenerateAddress} className="swap--eth--form">
        <div className="swap--eth--input">
            <input type="text" value={ethereumAddress} onChange={onChange} placeholder="Enter Ethereum address for receiving" />
            <button type="button" className="metamask-logo" onClick={getMetaMaskAddress}><MetaMask /></button>
            <button type="submit" className="button--white swap--eth--submit" disabled={!ethereumAddress}>Go</button>
        </div>
    </form>
</div>;
