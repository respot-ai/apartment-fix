import { makeLookupHandlers } from "../_lib/lookup.js";
import { defaultRooms } from "../_lib/seeds.js";

const handlers = makeLookupHandlers("rooms", defaultRooms);

export const GET = handlers.list;
export const POST = handlers.create;
