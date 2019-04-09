import { List } from "immutable";
import { createStandardAction } from "typesafe-actions";

import { Currency } from "@renex/react-components";
import { _captureBackgroundException_, _captureInteractionException_ } from "../../../lib/errors";
import { MultiAddress } from "../../../lib/types/types";

export const setQuoteCurrency = createStandardAction("setQuoteCurrency")<Currency>();
export const setEthereumAddress = createStandardAction("setEthereumAddress")<string | undefined>();
export const addToRedeemedUTXOs = createStandardAction("addToRedeemedUTXOs")<string>();
export const addToRenVMMessages = createStandardAction("addToRenVMMessages")<{ utxo: string, messages: List<{ messageID: string, multiAddress: MultiAddress }> }>();
export const addToSignatures = createStandardAction("addToSignatures")<{ utxo: string, signature: string }>();
