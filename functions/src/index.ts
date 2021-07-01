import * as dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config();
admin.initializeApp();

export { create } from "./endpoints/scrape/create/create";
export { update } from "./endpoints/scrape/update/update";
