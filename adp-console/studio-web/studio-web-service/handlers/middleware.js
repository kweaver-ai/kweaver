function jsonOnly(req, res, next) {
    if (
        [
            "/api/studioweb/ShareSite",
            "/api/studioweb/ShareMgnt",
            "/api/studioweb/ECMSManager",
        ].some((url) => url === req.originalUrl)
    ) {
        req.rawBody = "";

        req.on("data", function (chunk) {
            req.rawBody += chunk;
        });

        req.on("end", function () {
            try {
                req._body = JSON.parse(req.rawBody);
                req.body = req._body;
                next();
            } catch (e) {
                res.status(400);
                res.send(
                    JSON.stringify({
                        message: "error json type",
                    })
                );
            }
        });
    } else {
        next();
    }
}

export { jsonOnly };
