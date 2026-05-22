import { makeLookupHandlers } from "../_lib/lookup.js";
import { defaultTrades } from "../_lib/seeds.js";

const handlers = makeLookupHandlers("trades", defaultTrades);

export const DELETE = handlers.remove;
