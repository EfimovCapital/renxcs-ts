
export interface Param {
    index: number;
    private: boolean;
    value: string;
}

export interface Payload {
    method: string;
    params: Param[];
}

// Requests

export interface AddressesRequest {
    darknodeIDs: string[];
}

export interface SendMessageRequest {
    nonce: number;
    to: string;
    signature: string;
    payload: Payload;
}

export interface ReceiveMessageRequest {
    messageID: string;
}

// Responses

export interface Response {
    jsonrpc: string;
    version: string;
    id: number;
}

export interface HealthResponse extends Response {
    result: {
        version: string;
        address: string;
        cpus: {
            cores: number;
            clockRate: number;
            cacheSize: number;
            modelName: string;
        };
        ram: string;
        disk: string;
        location: string;
    };
}

export interface PeersResponse extends Response {
    result: {
        peers: string[];
    };
}

export interface NumPeersResponse extends Response {
    result: {
        numPeers: number;
    };
}

export interface EpochResponse extends Response {
    result: {
        epochHash: string;
        shardHashes: string[];
    };
}

export interface AddressesResponse extends Response {
    result: {
        addresses: string[];
    };
}

export interface SendMessageResponse extends Response {
    result: {
        messageID: string;
        ok: boolean;
    };
}

export interface ReceiveMessageResponse extends Response {
    result: {
        payload: Payload;
    };
}
