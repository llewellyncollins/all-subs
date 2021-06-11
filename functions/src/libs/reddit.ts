/* eslint-disable camelcase */
import fetch, { Headers, Response } from "node-fetch";
import { USER_AGENT } from "../constants/redditConfig";

interface IRedditAccessPayload {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

export interface ISubredditDetails {
    display_name: string;
    title: string;
    icon_size: number[];
    primary_color: string;
    icon_img: string;
    display_name_prefixed: string;
    subscribers: number;
    name: string;
    quarantine: boolean;
    advertiser_category: string; // Category
    public_description: string;
    community_icon: string;
    key_color: string;
    created: number;
    subreddit_type: string;
    id: string;
    over18: boolean;
    lang: string;
    url: string;
}

export interface ISubredditListNode {
    kind: string;
    data: ISubredditDetails;
}

export interface ISubredditList {
    modhash: string;
    dist: number;
    children: ISubredditListNode[];
    after: string;
    before?: string;
}

export interface ISubredditListing {
    kind: string;
    data: ISubredditList;
}

export const getAccessToken = async (): Promise<string> => {
    const headers = new Headers({
        "User-Agent": USER_AGENT,
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

export const requestSubredditListing = async (
    limit: number,
    after?: string | null
): Promise<Response> => {
    const headers = new Headers({ "User-Agent": USER_AGENT });
    const response = await fetch(
        `https://www.reddit.com/reddits.json?limit=${limit}&after=${
            after || null
        }`,
        {
            method: "get",
            headers,
        }
    );

    return response;
};
