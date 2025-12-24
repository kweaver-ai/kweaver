const { spawnSync } = require("child_process");
const path = require("path");

spawnSync(
    process.execPath,
    [
        require.resolve("create-react-app"),
        "--template",
        "file:../scaffolds/cra-template-applet",
        "--scripts-version",
        "file:../scaffolds/react-scripts",
        ...process.argv.slice(2),
    ],
    {
        stdio: "inherit",
        cwd: path.resolve(__dirname, "../packages"),
    }
);
