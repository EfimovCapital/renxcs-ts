import thunk from "redux-thunk";

import { applyMiddleware, createStore, Middleware } from "redux";

import { environment } from "../lib/environmentVariables";
import { rootReducer } from "../store/reducers/rootReducer";

const middlewares: Middleware[] = [
    thunk,
];

// Log Redux actions (only in development)
if (environment === "local") {
    // middlewares.push(createLogger({ collapsed: true }));
}

export const configureStore = () => createStore(
    rootReducer,
    applyMiddleware(...middlewares),
);
