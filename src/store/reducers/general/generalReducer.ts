import { ActionType, getType } from "typesafe-actions";

import * as generalActions from "../../../store/actions/general/generalActions";

import { GeneralData } from "../../types/general";

type GeneralActions = ActionType<typeof generalActions>;

// tslint:disable-next-line: cyclomatic-complexity
export const generalReducer = (state: GeneralData = new GeneralData(), action: GeneralActions) => {
    switch (action.type) {
        case getType(generalActions.storeQuoteCurrency):
            return state.set("quoteCurrency", action.payload);

        default:
            return state;
    }
};
