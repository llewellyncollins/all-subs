import * as admin from "firebase-admin";

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const FUNCTION_REGION = "europe-west2";
