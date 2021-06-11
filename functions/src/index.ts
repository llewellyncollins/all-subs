import * as dotenv from "dotenv";
import * as admin from "firebase-admin";

dotenv.config();
admin.initializeApp();

export { scrapeSubreddits } from "./endpoints/scrapeSubreddits";
