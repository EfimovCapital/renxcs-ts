import { createStandardAction } from "typesafe-actions";

import { Currency } from "@renex/react-components";
import { _captureBackgroundException_, _captureInteractionException_ } from "../../../lib/errors";

export const setQuoteCurrency = createStandardAction("setQuoteCurrency")<Currency>();
export const setEthereumAddress = createStandardAction("setEthereumAddress")<string | undefined>();
export const addToRedeemedUTXOs = createStandardAction("addToRedeemedUTXOs")<string>();
