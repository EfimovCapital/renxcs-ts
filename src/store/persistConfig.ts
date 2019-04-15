import storage from "redux-persist/lib/storage";

import { createTransform, PersistConfig } from "redux-persist";

import { _captureBackgroundException_ } from "../lib/util/errors";
import { ApplicationData, GeneralData } from "./types/general";

// Local Storage:

const generalTransform = createTransform<GeneralData, string>(
    (inboundState: GeneralData, key: string): string => {
        try {
            return inboundState.serialize();
        } catch (error) {
            // tslint:disable-next-line: no-console
            console.error(`Error serializing ${key} (${JSON.stringify(inboundState)}): ${error}`);
            _captureBackgroundException_(error, { description: "Error serializing local storage" });
            throw error;
        }
    },
    (outboundState: string, key: string): GeneralData => {
        try {
            return new GeneralData().deserialize(outboundState);
        } catch (error) {
            // tslint:disable-next-line: no-console
            console.error(`Error deserializing ${key} (${JSON.stringify(outboundState)}): ${error}`);
            _captureBackgroundException_(error, { description: "Error deserializing local storage" });
            throw error;
        }
    },
    { whitelist: ["general"] as Array<keyof ApplicationData>, },
);

export const persistConfig: PersistConfig = {
    storage,
    key: "renxcs",
    whitelist: ["general"] as Array<keyof ApplicationData>,
    transforms: [generalTransform],
};
