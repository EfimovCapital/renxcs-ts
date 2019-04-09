import { List, Map } from "immutable";

import { MultiAddress, multiAddressToID } from "../types/types";
import { Darknode } from "./darknode";
import {
    ReceiveMessageRequest,
    ReceiveMessageResponse,
    SendMessageRequest,
    SendMessageResponse,
} from "./types";

export const bootstrapNode0 = MultiAddress("/ip4/3.88.22.140/tcp/18514/ren/8MHnA2HRUsfBCwPCzyC2a1tGkWUvhR");
export const bootstrapNode1 = MultiAddress("/ip4/34.219.91.31/tcp/18514/ren/8MHktU1qWnDbH3zhum2A829i5QQMDg");

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

    public sendMessage = async (request: SendMessageRequest): Promise<List<SendMessageResponse | null>> => {
        return promiseAll<SendMessageResponse | null>(
            this.darknodes.valueSeq().map(darknode => darknode.sendMessage(request)).toList(),
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
