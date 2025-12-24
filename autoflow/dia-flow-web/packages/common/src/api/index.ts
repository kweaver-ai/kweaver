import { Api } from "@applet/api";

const RefreshableCodes = [
    401000000,
    401001001,
    401014000,
    401015000,
    401016001,
    "Common.UnAuthorization",
    "Public.Unauthorized",
];

const API = new Api({
    isRefreshable(err) {
        return !!err.response?.data?.code && RefreshableCodes.includes(err.response.data.code);
    },
});

export default API;
