export * from './consoleHelper'

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const isServer = typeof window === "undefined";

