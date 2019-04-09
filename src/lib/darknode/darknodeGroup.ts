import { List, Map } from "immutable";

import { MultiAddress, multiAddressToID } from "../types/types";
import { Darknode } from "./darknode";
import {
    HealthResponse,
    ReceiveMessageRequest,
    ReceiveMessageResponse,
    SendMessageRequest,
    SendMessageResponse,
} from "./types";

const bootStrapNode0 = MultiAddress("/ip4/3.88.22.140/tcp/18515/8MJpA1rXYMPTeJoYjsFBHJcuYBe7zP");
const bootStrapNode1 = MultiAddress("/ip4/34.219.91.31/tcp/18515/8MH9zGoDLJKiXrhqWLXTzHp1idfxte");
const bootStrapNode2 = MultiAddress("/ip4/3.92.234.171/tcp/18515/8MGJGnGLdYF6x5YuhkAmgfj6kknJBb");
const bootStrapNode3 = MultiAddress("/ip4/35.183.181.45/tcp/18515/8MJppC57CkHzDQVAAPTotQGGyzqJ2r");
const bootStrapNode4 = MultiAddress("/ip4/13.233.251.189/tcp/18515/8MHdUqYXcEhisZipM3hXPsFxHfM3VH");
const bootStrapNode5 = MultiAddress("/ip4/34.221.196.212/tcp/18515/8MJd7zB9GXsvpm2cSECFP4Bof5G3i8");
const bootStrapNode6 = MultiAddress("/ip4/35.158.105.90/tcp/18515/8MJN1hHhdcJwzDoj35zRLL3zE3yk45");
const bootStrapNode7 = MultiAddress("/ip4/52.67.113.89/tcp/18515/8MKYusXyZAGVRn76vTmnK9FWmmPbJj");

export const bootstrapNodes = [
    bootStrapNode0,
    bootStrapNode1,
    bootStrapNode2,
    bootStrapNode3,
    bootStrapNode4,
    bootStrapNode5,
    bootStrapNode6,
    bootStrapNode7,
];

const promiseAll = async <a>(list: List<Promise<a>>, defaultValue: a): Promise<List<a>> => {
    let newList = List<a>();
    for (const entryP of list.toArray()) {
        try {
            newList = newList.push(await entryP);
        } catch (error) {
            newList = newList.push(defaultValue);
        }
    }
    return newList;
};

/**
 * DarknodeGroup allows sending messages to multiple darknodes
 */
export class DarknodeGroup {
    public bootstraps = List<MultiAddress>();
    public darknodes = Map<string, Darknode>();

    constructor(multiAddresses: MultiAddress[] | MultiAddress) {
        if (Array.isArray(multiAddresses)) {
            this.bootstraps = this.bootstraps.concat(multiAddresses);
            this.addDarknodes(multiAddresses);
        } else {
            this.addDarknodes([multiAddresses]);
        }
        this.bootstraps = this.bootstraps.concat(multiAddresses);
    }

    public bootstrap = async (): Promise<this> => {
        let success = false;
        let lastError;
        for (const multiAddress of this.bootstraps.toArray()) {
            try {
                const result: Darknode | undefined = this.darknodes.get(multiAddressToID(multiAddress).id);
                if (!result) {
                    throw new Error("No darknode provided");
                }
                const peers = await result.getPeers();
                this.addDarknodes(peers.result.peers.map(MultiAddress));
                success = true;
            } catch (error) {
                lastError = error;
            }
        }
        if (!success) {
            throw lastError;
        }
        return this;
    }

    public getHealth = async (): Promise<List<HealthResponse | null>> => {
        return promiseAll<HealthResponse | null>(
            this.darknodes.valueSeq().map(darknode => darknode.getHealth()).toList(),
            null,
        );
    }

    public sendMessage = async (request: SendMessageRequest): Promise<List<{ result: SendMessageResponse, multiAddress: MultiAddress } | null>> => {
        return promiseAll<{ result: SendMessageResponse, multiAddress: MultiAddress } | null>(
            this.darknodes.valueSeq().map(async (darknode) => ({
                multiAddress: darknode.multiAddress,
                result: await darknode.sendMessage(request),
            })).toList(),
            null,
        );
    }

    public receiveMessage = async (request: ReceiveMessageRequest): Promise<List<ReceiveMessageResponse | null>> => {
        return promiseAll<ReceiveMessageResponse | null>(
            this.darknodes.valueSeq().map(darknode => darknode.receiveMessage(request)).toList(),
            null,
        );
    }

    private readonly addDarknodes = (multiAddresses: MultiAddress[]): this => {
        for (const multiAddress of multiAddresses) {
            this.darknodes = this.darknodes.set(multiAddressToID(multiAddress).id, new Darknode(multiAddress));
        }
        return this;
    }
}

export class WarpGateGroup extends DarknodeGroup {
    constructor(multiAddresses: MultiAddress[] | MultiAddress) {
        super(multiAddresses);
        this.getHealth();
    }

    public submitDeposits = async (address: string): Promise<List<{ messageID: string, multiAddress: MultiAddress }>> => {
        const results = await this.sendMessage({
            nonce: 0,
            to: "WarpGate",
            signature: "",
            payload: {
                method: "MintZBTC",
                args: [
                    {
                        value: address.slice(0, 2) === "0x" ? address.slice(2) : address,
                    }
                ],
            },
        });

        if (results.filter(x => x !== null).size < 1) {
            throw new Error("Unable to send message to enough darknodes.");
        }

        return results.filter(x => x !== null).map((result) => ({
            // tslint:disable: no-non-null-assertion
            multiAddress: result!.multiAddress,
            messageID: result!.result.result.messageID,
            // tslint:enable: no-non-null-assertion
        })).toList();
    }

    public checkForResponse = async (messages: List<{ messageID: string, multiAddress: MultiAddress }>): Promise<string> => {
        for (const { messageID, multiAddress } of messages.toArray()) {
            const node = this.darknodes.get(multiAddressToID(multiAddress).id);
            if (node) {
                try {
                    const signature = await node.receiveMessage({ messageID });
                    // Error:
                    // { "jsonrpc": "2.0", "version": "0.1", "error": { "code": -32603, "message": "result not available", "data": null }, "id": null }
                    // Success:
                    // (TODO)
                    if (signature.result) {
                        console.log(signature.result);
                        return signature.result.payload.args;
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
        throw new Error(`Signature not available`);
    }
}
