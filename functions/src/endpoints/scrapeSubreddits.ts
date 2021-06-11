import * as functions from "firebase-functions";
import { db } from "../libs/firebase";
import {
    getAccessToken,
    ISubredditListing,
    requestSubredditListing,
} from "../libs/reddit";
import { delay } from "../utils/delay";
import { checkResponse } from "../utils/checkResponse";

const updateSubredditsByListing = async (
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
            const batch = db.batch();

            for (let index = 0; index < listing.data.children.length; index++) {
                const node = listing.data.children[index];
                const subreddit = node.data;

                batch.set(db.collection("subreddits").doc(subreddit.id), {
                    display_name: subreddit.display_name,
                    title: subreddit.title,
                    icon_size: subreddit.icon_size,
                    primary_color: subreddit.primary_color,
                    icon_img: subreddit.icon_img,
                    display_name_prefixed: subreddit.display_name_prefixed,
                    subscribers: subreddit.subscribers,
                    name: subreddit.name,
                    quarantine: subreddit.quarantine,
                    advertiser_category: subreddit.advertiser_category,
                    public_description: subreddit.public_description,
                    community_icon: subreddit.community_icon,
                    key_color: subreddit.key_color,
                    created: subreddit.created,
                    subreddit_type: subreddit.subreddit_type,
                    id: subreddit.id,
                    over18: subreddit.over18,
                    lang: subreddit.lang,
                    url: subreddit.url,
                });
            }

            await batch.commit();

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

                await updateSubredditsByListing(
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

export const scrapeSubreddits = functions
    .runWith(runtimeOpts)
    .https.onRequest(async (_, response) => {
        const accessToken = await getAccessToken();
        try {
            await updateSubredditsByListing(accessToken, 0);
            response.send("Yay");
        } catch (error) {
            console.error(error);
            functions.logger.error(error);
            response.send(error);
        }
    });
