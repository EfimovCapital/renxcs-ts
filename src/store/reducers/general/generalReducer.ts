import { ActionType, getType } from "typesafe-actions";

import * as generalActions from "../../../store/actions/general/generalActions";

import { GeneralData } from "../../types/general";

type GeneralActions = ActionType<typeof generalActions>;

// tslint:disable-next-line: cyclomatic-complexity
export const generalReducer = (state: GeneralData = new GeneralData(), action: GeneralActions) => {
    switch (action.type) {
        case getType(generalActions.setQuoteCurrency):
            return state.set("quoteCurrency", action.payload);

        case getType(generalActions.setEthereumAddress):
            return state.set("ethereumAddress", action.payload);

        case getType(generalActions.setEvents):
            return state.set("allEvents", state.allEvents.set(action.payload.ethereumAddress, action.payload.events));

        default:
            return state;
    }
};
