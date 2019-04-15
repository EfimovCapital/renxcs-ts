import { OrderedMap } from "immutable";
import { createStandardAction } from "typesafe-actions";

import { Currency } from "@renex/react-components";
import { _captureBackgroundException_, _captureInteractionException_ } from "../../../lib/util/errors";
import { XCSEvent } from "../../types/general";

export const setQuoteCurrency = createStandardAction("setQuoteCurrency")<Currency>();
export const setEthereumAddress = createStandardAction("setEthereumAddress")<string | undefined>();

export const setEvents = createStandardAction("addToRedeemedUTXOs")<OrderedMap<string, XCSEvent>>();
