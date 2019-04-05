import { Currency, Record } from "@renex/react-components";
import { Map as ImmutableMap, OrderedMap, Set } from "immutable";

import { _captureBackgroundException_, _captureInteractionException_ } from "../../lib/errors";
import { validateType } from "../../lib/persist";

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

const syncedGeneralData = new Map()
    .set("ethereumAddress", "string")
    .set("advanced", "boolean")
    .set("theme", "string")
    .set("advancedTheme", "string")
    .set("redeemedUTXOs", "Set<string>")
    .set("quoteCurrency", "string");
export class GeneralData extends Record({
    ethereumAddress: "0x5Ea5F67cC958023F2da2ea92231d358F2a3BbA47" as string | undefined,
    redeemedUTXOs: Set<string>(),

    // UI
    advanced: false,
    theme: UITheme.Light,
    advancedTheme: UITheme.Dark,

    // address: null as string | null,
    url: null as string | null,
    quoteCurrency: Currency.USD,
}) implements Serializable<GeneralData> {

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
                    next = next.set(
                        key,
                        validateType(syncedGeneralData.get(key), data[key])
                    );
                } catch (error) {
                    _captureInteractionException_(error, { description: "Error in GeneralData.deserialize", shownToUser: "No" });
                }
            }
        } catch (error) {
            _captureBackgroundException_(error, {
                description: "cannot deserialize local storage",
            });
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
