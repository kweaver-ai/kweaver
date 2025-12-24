const { jsonOnly } = require("../middleware");
import { res } from "../mockPath/db.mock";

describe("jsonOnly", () => {
    it("参数为 {}, res, () => { }", () => {
        jsonOnly({}, res, () => {});
    });
});
