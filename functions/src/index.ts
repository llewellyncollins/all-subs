import * as dotenv from "dotenv";
import * as functions from "firebase-functions";
import fetch, { Headers } from "node-fetch";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

dotenv.config();

interface IRedditAccessPayload {
    // eslint-disable-next-line camelcase
    access_token: string;
    // eslint-disable-next-line camelcase
    token_type: string;
    // eslint-disable-next-line camelcase
    expires_in: number;
    scope: string;
}

const getAccessToken = async (): Promise<string> => {
    const headers = new Headers({
        "User-Agent": "Guess-the-sub/0.0.1",
        Authorization:
            "Basic " +
            Buffer.from(
                `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_SECRET_TOKEN}`
            ).toString("base64"),
    });

    const res = await fetch(
        "https://www.reddit.com/api/v1/access_token" +
            `?grant_type=password&username=${process.env.REDDIT_USERNAME}&password=${process.env.REDDIT_PASSWORD}`,
        {
            method: "post",
            headers,
        }
    );
    const data = (await res.json()) as IRedditAccessPayload;

    return data.access_token;
};

export const accessToken = functions.https.onRequest(async (_, response) => {
    try {
        const accessToken = await getAccessToken();
        response.send(accessToken);
    } catch (error) {
        response.status(500);
        response.send(error);
    }
});
