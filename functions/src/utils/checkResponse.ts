import { Response } from "node-fetch";

export const checkResponse = (
    response: Response
): [Response | null, Error | null] => {
    if (response.ok) {
        return [response, null];
    } else {
        return [
            null,
            new Error(
                `HTTP Error Response: ${response.status} ${response.statusText} ${response.body}`
            ),
        ];
    }
};
