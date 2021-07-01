import { db, FieldValue } from "../../../libs/firebase";
import {
    ISubredditDetails,
    ISubredditListing,
    ISubredditListNode,
} from "../../../libs/reddit";
import {
    createListingsInDB,
    TransactionResponse,
} from "../create/createListingsInDB";

export const updateListingsInDB = async (
    listing: ISubredditListing
): Promise<TransactionResponse> => {
    try {
        const collectionRef = db.collection("subreddits");
        const establishedSubreddits: ISubredditDetails[] = [];
        const newSubreddits: ISubredditListNode[] = [];

        // batch read
        await db.runTransaction(async (transaction) => {
            for (let index = 0; index < listing.data.children.length; index++) {
                const id = listing.data.children[index].data.id;
                const ref = collectionRef.doc(id);
                const doc = await transaction.get(ref);

                if (doc.exists) {
                    establishedSubreddits.push(doc.data() as ISubredditDetails);
                } else {
                    newSubreddits.push(listing.data.children[index]);
                }
            }
        });

        // batch write
        const batch = db.batch();

        // add new subreddits
        const [newSubbredditCount] = await createListingsInDB({
            data: { children: newSubreddits },
        });

        // update established subreddits
        for (let index = 0; index < establishedSubreddits.length; index++) {
            const oldData = establishedSubreddits[index];
            const newListing = listing.data.children.find(
                (listing) => listing.data.id === oldData.id
            );

            if (newListing) {
                const newData = newListing.data;
                const ref = collectionRef.doc(newData.id);

                if (newData.subscribers !== oldData?.subscribers) {
                    batch.update(ref, {
                        subscribers: newData.subscribers,
                        subscribersDelta:
                            newData.subscribers - oldData?.subscribers,
                        updated: FieldValue.serverTimestamp(),
                        testOld: oldData?.subscribers,
                        testNew: newData.subscribers,
                    });
                }
            }
        }

        await batch.commit();

        return [newSubbredditCount];
    } catch (error) {
        return [0, error];
    }
};
