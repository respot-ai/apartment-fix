import { makeLookupHandlers } from "../_lib/lookup.js";
import { defaultRooms } from "../_lib/seeds.js";

const handlers = makeLookupHandlers("rooms", defaultRooms);

export const DELETE = handlers.remove;
