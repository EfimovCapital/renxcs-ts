import { DarknodeID, MultiAddress, NewMultiAddress } from "../types/types";

export const fetchMultiAddress = (darknodeID: DarknodeID): MultiAddress => {
    return NewMultiAddress(darknodeID.id);
};
