interface ApiRequestOptions extends RequestInit {}

export const makeApiRequest = async (
    url: string,
    method: string,
    headers?: Record<string, string>,
    body?: string
): Promise<any> => {
    try {
        const options: ApiRequestOptions = {
            method,
            headers,
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = body;
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseText = await response.text();
        try {
            // Try to parse the response as JSON.
            return JSON.parse(responseText);
        } catch (e) {
            // If parsing fails, it's likely not JSON, so return the raw text.
            return responseText;
        }

    } catch (error) {
        console.error("Error making API request:", error);
        if (error instanceof Error) {
            throw new Error(`Request Failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during the API request.");
    }
};