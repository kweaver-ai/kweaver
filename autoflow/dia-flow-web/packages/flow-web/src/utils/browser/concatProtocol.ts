export const concatProtocol = (url: string): string => {
    if (
        url.substring(0, 7).toLowerCase() === "http://" ||
        url.substring(0, 8).toLowerCase() === "https://"
    ) {
        return url;
    }
    return "https://" + url;
};
