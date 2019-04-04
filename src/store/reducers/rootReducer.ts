import { combineReducers } from "redux";

import { generalReducer } from "./general/generalReducer";
import { marketReducer } from "./market/marketReducer";

import { ApplicationData } from "../types/general";

export const rootReducer = combineReducers<ApplicationData>({
    general: generalReducer,
    marketPrices: marketReducer,
});
