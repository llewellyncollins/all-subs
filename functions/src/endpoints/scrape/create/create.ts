import * as functions from "firebase-functions";
import { db, FieldValue } from "../../../libs/firebase";
import {
    getAccessToken,
    ISubredditListing,
    requestSubredditListing,
} from "../../../libs/reddit";
import { delay } from "../../../utils/delay";
import { checkResponse } from "../../../utils/checkResponse";
import { createListingsInDB } from "./createListingsInDB";

const createSubredditsByListing = async (
    accessToken: string,
    index: number,
    after?: string | null
) => {
    const limit = (index + 1) * 100;
    const [response, error] = checkResponse(
        await requestSubredditListing(limit, after)
    );

    if (response) {
        const listing: ISubredditListing = await response.json();

        if (listing) {
            let updatedNodeCount = 0;
            let transactionError;

            // create listings in firestore
            [updatedNodeCount, transactionError] = await createListingsInDB(
                listing
            );

            if (transactionError) {
                throw transactionError;
            }

            // update subreddit count
            const statsRef = db.collection("stats").doc("subreddits");
            await statsRef.update({
                count: FieldValue.increment(updatedNodeCount),
            });

            if (listing.data?.after) {
                if (
                    response.headers.get("x-ratelimit-remaining") &&
                    response.headers.get("x-ratelimit-reset") &&
                    Number(response.headers.get("x-ratelimit-remaining")) <= 1
                ) {
                    functions.logger.info(
                        "Buffer requets by:",
                        response.headers.get("x-ratelimit-reset")
                    );
                    await delay(
                        Number(response.headers.get("x-ratelimit-reset"))
                    );
                }

                await createSubredditsByListing(
                    accessToken,
                    index + 1,
                    listing.data.after
                );
            }
        }
    } else {
        throw error;
    }
};

const runtimeOpts: functions.RuntimeOptions = {
    timeoutSeconds: 540,
    memory: "4GB",
};

export const create = functions
    .runWith(runtimeOpts)
    .https.onRequest(async (_, response) => {
        const accessToken = await getAccessToken();
        try {
            const statsRef = db.collection("stats").doc("subreddits");

            await statsRef.create({ count: 0 });
            await createSubredditsByListing(accessToken, 0);

            response.sendStatus(200);
        } catch (error) {
            console.error(error);
            functions.logger.error(error);
            response.sendStatus(500);
        }
    });
