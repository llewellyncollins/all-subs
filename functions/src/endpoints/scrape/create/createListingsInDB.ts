import { db, FieldValue } from "../../../libs/firebase";
import { ISubredditListing } from "../../../libs/reddit";

export type TransactionResponse = [number, Error?];

export const createListingsInDB = async (
    listing: ISubredditListing
): Promise<TransactionResponse> => {
    try {
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
                active_user_count: subreddit.active_user_count,
                subscribers: subreddit.subscribers,
                subscribersDelta: 0,
                name: subreddit.name,
                quarantine: subreddit.quarantine,
                advertiser_category: subreddit.advertiser_category,
                public_description: subreddit.public_description,
                community_icon: subreddit.community_icon,
                key_color: subreddit.key_color,
                dateCreated: subreddit.created,
                subreddit_type: subreddit.subreddit_type,
                id: subreddit.id,
                over18: subreddit.over18,
                lang: subreddit.lang,
                url: subreddit.url,
                created: FieldValue.serverTimestamp(),
                updated: FieldValue.serverTimestamp(),
            });
        }

        await batch.commit();

        return [listing.data.children.length];
    } catch (error) {
        return [0, error];
    }
};
