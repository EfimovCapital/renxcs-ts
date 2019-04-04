import { Currency, Record } from "@renex/react-components";
import { Map, OrderedMap } from "immutable";

import { _captureBackgroundException_, _captureInteractionException_ } from "../../lib/errors";

export interface ApplicationData {
    general: GeneralData;
    marketPrices: MarketPriceData;
}

export enum UITheme {
    Light = "theme-light", // light theme's CSS class
    Dark = "theme-dark", // dark theme's CSS class
}

export class GeneralData extends Record({
    // UI
    advanced: false,
    theme: UITheme.Light,
    advancedTheme: UITheme.Dark,

    // address: null as string | null,
    url: null as string | null,
    quoteCurrency: Currency.USD,
}) { }

export interface MarketPrice {
    price: number;
    percentChange: number;
}

export const UnknownMarketPrice: MarketPrice = {
    price: 0,
    percentChange: 0,
};

export type TokenPrices = Map<string, Map<Currency, number>>;

export class MarketPriceData extends Record({
    updating: false,
    marketPrices: OrderedMap<string, MarketPrice>(),
    tokenPrices: null as TokenPrices | null,
}) { }
