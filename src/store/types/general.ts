import { Currency, Record } from "@renex/react-components";
import { List, Map as ImmutableMap, OrderedMap } from "immutable";

import { BitcoinUTXO } from "../../lib/blockchain/btc/btc";
import { ZcashUTXO } from "../../lib/blockchain/btc/zec";
import { Currency as XCSCurrency, UTXO } from "../../lib/blockchain/depositAddresses";
import { lightnodes, WarpGateGroup } from "../../lib/darknode/darknodeGroup";
import { _captureBackgroundException_, _captureInteractionException_ } from "../../lib/util/errors";
import { validateType } from "../../lib/util/persist";

interface Serializable<T> {
    serialize(): string;
    deserialize(str: string): T;
}

export interface ApplicationData {
    general: GeneralData;
    marketPrices: MarketPriceData;
}

export enum UITheme {
    Light = "theme-light", // light theme's CSS class
    Dark = "theme-dark", // dark theme's CSS class
}

export enum EventType {
    Deposit = "deposit",
    Mint = "mint",
    Burn = "burn",
}

export class Deposit extends Record({
    id: "",
    isXCSEvent: true,
    type: EventType.Deposit,
    // tslint:disable-next-line: no-object-literal-type-assertion
    utxo: List<BitcoinUTXO | ZcashUTXO>(),
    currency: XCSCurrency.BTC,
}) { }

export class Mint extends Record({
    id: "",
    isXCSEvent: true,
    type: EventType.Mint,
    utxos: List<UTXO>(),
    mintTransaction: undefined as string | undefined,
    messageID: "",
    messageIDs: List<string>(),
}) { }

export class Burn extends Record({
    id: "",
    isXCSEvent: true,
    type: EventType.Burn,
    currency: XCSCurrency.BTC,
    amount: "0",
    to: "",
    messageID: "",
    burnTransaction: undefined as string | undefined,
}) { }

export type XCSEvent = Deposit | Mint | Burn;

const GeneralDataInner = {
    ethereumAddress: "0x5Ea5F67cC958023F2da2ea92231d358F2a3BbA47" as string | undefined,

    allEvents: ImmutableMap<string, OrderedMap<string, XCSEvent>>(),

    darknodeGroup: new WarpGateGroup(lightnodes),

    // UI
    advanced: false,
    theme: UITheme.Light,
    advancedTheme: UITheme.Dark,

    // address: null as string | null,
    url: null as string | null,
    quoteCurrency: Currency.USD,
};

const syncedGeneralData = new Map<keyof typeof GeneralDataInner, string>()
    .set("ethereumAddress", "string")
    .set("advanced", "boolean")
    .set("theme", "string")
    .set("advancedTheme", "string")
    .set("allEvents", "OrderedMap<string, object>")
    .set("quoteCurrency", "string");
export class GeneralData extends Record(GeneralDataInner) implements Serializable<GeneralData> {

    public serialize(): string {
        const obj = {};
        for (const key of Array.from(syncedGeneralData.keys())) {
            obj[key] = this.get(key);
        }
        return JSON.stringify(obj);
    }

    public deserialize(str: string): GeneralData {
        // tslint:disable-next-line:no-this-assignment
        let next = this;
        try {
            const data = JSON.parse(str);
            for (const key of Array.from(syncedGeneralData.keys())) {
                try {
                    const expectedType = syncedGeneralData.get(key);
                    if (key === "allEvents") {
                        const allEvents = data[key];
                        if (!allEvents) {
                            continue;
                        }
                        let nextAllEvents = ImmutableMap<string, OrderedMap<string, XCSEvent>>();
                        for (const address of Object.keys(allEvents)) {
                            const events = allEvents[address];
                            if (!events) {
                                continue;
                            }
                            let nextEvents = OrderedMap<string, XCSEvent>();
                            for (const childKey of Object.keys(events)) {
                                const child = events[childKey];
                                let event;
                                if (child.type === EventType.Deposit) {
                                    event = new Deposit({ ...child, utxo: List(child.utxo) });
                                } else if (child.type === EventType.Burn) {
                                    event = new Burn(child);
                                } else if (child.type === EventType.Mint) {
                                    event = new Mint({ ...child, utxos: List(child.utxos) });
                                } else {
                                    throw new Error("Unknown XCSEvent type");
                                }
                                nextEvents = nextEvents.set(event.id, event);
                            }
                            nextAllEvents = nextAllEvents.set(address, nextEvents);
                        }
                        next = next.set(key, nextAllEvents);
                    } else if (expectedType) {
                        next = next.set(
                            key,
                            // tslint:disable-next-line: no-any
                            validateType(expectedType, data[key]) as any
                        );
                    }
                } catch (error) {
                    _captureInteractionException_(error, { description: "Error in GeneralData.deserialize", shownToUser: "No" });
                }
            }
        } catch (error) {
            _captureBackgroundException_(error, {
                description: "cannot deserialize local storage",
            });
            // TODO: Remove me!!!
            alert("Check console!");
        }
        return next;
    }
}

export interface MarketPrice {
    price: number;
    percentChange: number;
}

export const UnknownMarketPrice: MarketPrice = {
    price: 0,
    percentChange: 0,
};

export type TokenPrices = ImmutableMap<string, ImmutableMap<Currency, number>>;

export class MarketPriceData extends Record({
    updating: false,
    marketPrices: OrderedMap<string, MarketPrice>(),
    tokenPrices: null as TokenPrices | null,
}) { }
