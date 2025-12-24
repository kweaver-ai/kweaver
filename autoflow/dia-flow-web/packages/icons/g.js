const fs = require("fs");
const path = require("path");

const types = fs.readdirSync("./inline-svg");

const items = types.flatMap((typeDir) => {
    return fs.readdirSync(`./inline-svg/${typeDir}`).map((name) => `./inline-svg/${typeDir}/${name}`);
});

const itemsHtml = items
    .map((name) => {
        return `<section style="width:120px;height:120px;float:left;"><h3 style="font-size:12px;">${name}</h3><div style="font-size:64px;">${fs.readFileSync(
            name,
            {
                encoding: "utf-8",
            }
        )}</div></section>`;
    })
    .join("");

fs.writeFileSync(
    "index.html",
    `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    ${itemsHtml}
</body>
</html>`,
    { encoding: "utf-8" }
);
