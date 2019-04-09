import { DarknodeID, MultiAddress } from "../types/types";

export const fetchMultiAddress = (darknodeID: DarknodeID): MultiAddress => {
    return MultiAddress(darknodeID.id);
};
