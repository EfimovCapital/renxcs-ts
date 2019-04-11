export const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

export const NETWORK = process.env.REACT_APP_NETWORK;
export const SOURCE_VERSION = process.env.REACT_APP_SOURCE_VERSION;
export const INFURA = process.env.REACT_APP_INFURA;

// export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export const environment = ((process.env.NODE_ENV === "development") ? "local" : NETWORK) || "unknown";
