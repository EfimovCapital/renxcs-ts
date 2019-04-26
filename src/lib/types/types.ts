export type DarknodeID = { id: string };
export const NewDarknodeID = (id: string) => ({ id });

export type MultiAddress = { multiAddress: string };
// export const NewMultiAddress = (multiAddress: string) => ({ multiAddress });

// export const multiAddressToID = (multiAddress: MultiAddress): DarknodeID => {
//     const split = multiAddress.multiAddress.split("/");
//     return { id: split[split.length - 1] };
// };
