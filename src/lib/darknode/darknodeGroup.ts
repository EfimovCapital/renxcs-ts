import { List, Map } from "immutable";

import { Mint } from "../../store/types/general";
import { Currency, UTXO } from "../blockchain/depositAddresses";
import { Lightnode } from "./darknode";
import {
    HealthResponse,
    ReceiveMessageRequest,
    ReceiveMessageResponse,
    RenVMReceiveMessageResponse,
    SendMessageRequest,
    // tslint:disable-next-line: no-unused-variable
    SendMessageResponse,
} from "./types";

export const lightnodes = [
    "https://lightnode.herokuapp.com",
];

// const bootStrapNode0 = NewMultiAddress("/ip4/18.234.163.143/tcp/18515/8MJpA1rXYMPTeJoYjsFBHJcuYBe7zP");
// const bootStrapNode1 = NewMultiAddress("/ip4/34.213.51.170/tcp/18515/8MH9zGoDLJKiXrhqWLXTzHp1idfxte");
// const bootStrapNode2 = NewMultiAddress("/ip4/34.205.143.11/tcp/18515/8MGJGnGLdYF6x5YuhkAmgfj6kknJBb");
// const bootStrapNode3 = NewMultiAddress("/ip4/99.79.61.64/tcp/18515/8MJppC57CkHzDQVAAPTotQGGyzqJ2r");
// const bootStrapNode4 = NewMultiAddress("/ip4/35.154.42.26/tcp/18515/8MHdUqYXcEhisZipM3hXPsFxHfM3VH");
// const bootStrapNode5 = NewMultiAddress("/ip4/34.220.215.156/tcp/18515/8MJd7zB9GXsvpm2cSECFP4Bof5G3i8");
// const bootStrapNode6 = NewMultiAddress("/ip4/18.196.15.243/tcp/18515/8MJN1hHhdcJwzDoj35zRLL3zE3yk45");
// const bootStrapNode7 = NewMultiAddress("/ip4/18.231.179.161/tcp/18515/8MKYusXyZAGVRn76vTmnK9FWmmPbJj");

// export const bootstrapNodes = [
//     bootStrapNode0,
//     bootStrapNode1,
//     bootStrapNode2,
//     bootStrapNode3,
//     bootStrapNode4,
//     bootStrapNode5,
//     bootStrapNode6,
//     bootStrapNode7,
// ];

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
    public bootstraps = List<string>();
    public darknodes = Map<string, Lightnode>();

    constructor(multiAddresses: string[] | string) {
        if (Array.isArray(multiAddresses)) {
            this.bootstraps = this.bootstraps.concat(multiAddresses);
            this.addLightnodes(multiAddresses);
        } else {
            this.addLightnodes([multiAddresses]);
        }
        this.bootstraps = this.bootstraps.concat(multiAddresses);
    }

    // public bootstrap = async (): Promise<this> => {
    //     let success = false;
    //     let lastError;
    //     for (const multiAddress of this.bootstraps.toArray()) {
    //         try {
    //             const result: Lightnode | undefined = this.darknodes.get(multiAddressToID(multiAddress).id);
    //             if (!result) {
    //                 throw new Error("No darknode provided");
    //             }
    //             const peers = await result.getPeers();
    //             if (peers.result) {
    //                 this.addLightnodes(peers.result.peers.map(NewMultiAddress));
    //                 success = true;
    //             } else if (peers.error) {
    //                 throw peers.error;
    //             }
    //         } catch (error) {
    //             lastError = error;
    //         }
    //     }
    //     if (!success) {
    //         throw lastError;
    //     }
    //     return this;
    // }

    public getHealth = async (): Promise<List<HealthResponse | null>> => {
        return promiseAll<HealthResponse | null>(
            this.darknodes.valueSeq().map(darknode => darknode.getHealth()).toList(),
            null,
        );
    }

    public sendMessage = async (request: SendMessageRequest): Promise<List<{ result: SendMessageResponse, lightnode: string } | null>> => {
        return promiseAll(
            this.darknodes.valueSeq().map(async (darknode) => ({
                lightnode: darknode.lightnodeURL,
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

    private readonly addLightnodes = (newLightnodes: string[]): this => {
        for (const lightnode of newLightnodes) {
            this.darknodes = this.darknodes.set(lightnode, new Lightnode(lightnode));
        }
        return this;
    }
}

export class WarpGateGroup extends DarknodeGroup {
    constructor(multiAddresses: string[] | string) {
        super(multiAddresses);
        // this.getHealth();
    }

    public submitDeposits = async (address: string, utxo: UTXO): Promise<List<{ messageID: string, lightnode: string }>> => {
        // TODO: If one fails, still return the other.

        const method = utxo.currency === Currency.BTC ? "MintZBTC"
            : utxo.currency === Currency.ZEC ? "MintZZEC" : undefined;

        if (!method) {
            throw new Error(`Minting ${utxo.currency} not supported`);
        }

        const results = await this.sendMessage({
            nonce: window.crypto.getRandomValues(new Uint32Array(1))[0],
            to: "WarpGate",
            signature: "",
            payload: {
                method,
                args: [
                    {
                        name: "uid",
                        type: "public",
                        value: address.slice(0, 2) === "0x" ? address.slice(2) : address,
                    }
                ],
            },
        });

        if (results.filter(x => x !== null).size < 1) {
            throw new Error("Unable to send message to lightnodes.");
        }

        return results.filter(x => x !== null).map((result) => ({
            // tslint:disable: no-non-null-assertion no-unnecessary-type-assertion
            lightnode: result!.lightnode,
            messageID: result!.result.result!.messageID,
            // tslint:enable: no-non-null-assertion no-unnecessary-type-assertion
        })).toList();
    }

    public checkForResponse = async (mintEvent: Mint): Promise<string> => {
        for (const node of this.darknodes.valueSeq().toArray()) {
            if (node) {
                try {
                    const signature = await node.receiveMessage({ messageID: mintEvent.messageID }) as RenVMReceiveMessageResponse;
                    // Error:
                    // { "jsonrpc": "2.0", "version": "0.1", "error": { "code": -32603, "message": "result not available", "data": null }, "id": null }
                    // Success:
                    // (TODO)
                    if (signature.result) {
                        return signature.result.values[0].value;
                    } else if (signature.error) {
                        throw signature.error;
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
        throw new Error(`Signature not available`);
    }
}
