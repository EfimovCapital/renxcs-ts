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

        case getType(generalActions.addToRedeemedUTXOs):
            return state.set("redeemedUTXOs", state.redeemedUTXOs.add(action.payload));

        case getType(generalActions.addToRenVMMessages):
            return state.set("renVMMessages", state.renVMMessages.set(action.payload.utxo, action.payload.messages));

        case getType(generalActions.addToUtxoToMessage):
            return state.set("utxoToMessage", state.utxoToMessage.set(action.payload.utxo, action.payload.message));

        case getType(generalActions.addToMessageToUtxos):
            return state.set("messageToUtxos", state.messageToUtxos.set(action.payload.message, action.payload.utxos));

        case getType(generalActions.addToSignatures):
            return state.set("signatures", state.signatures.set(action.payload.utxo, action.payload.signature));

        default:
            return state;
    }
};
