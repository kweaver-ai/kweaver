const { name } = require("./package.json");

module.exports = {
    roots: ["<rootDir>/src"],
    collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],
    testMatch: ["<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}", "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}"],
    testEnvironment: "jest-environment-jsdom-fourteen",
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": require.resolve("babel-jest"),
        "^.+\\.css$": "<rootDir>/config/jest/cssTransform.js",
        "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "<rootDir>/config/jest/fileTransform.js",
    },
    transformIgnorePatterns: ["[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$", "^.+\\.module\\.(css|sass|scss)$"],
    modulePaths: [],
    moduleNameMapper: {
        "^react-native$": "react-native-web",
        "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    },
    moduleFileExtensions: ["web.js", "js", "web.ts", "ts", "web.tsx", "tsx", "json", "web.jsx", "jsx", "node"],
    watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],

    collectCoverage: true,
    coverageDirectory: "testResult",
    coverageReporters: ["json", "lcov", "text", "clover", "html", "cobertura"],
    reporters: [
        "default",
        [
            "jest-junit",
            {
                suiteName: `${name.replace(/(\/|@)/g, "_")}`,
                outputDirectory: "testResult/junitResult",
                outputName: `ut${name.replace(/(\/|@)/g, "_")}.xml`,
                classNameTemplate: "{classname}-{title}",
                titleTemplate: "{classname}-{title}",
                ancestorSeparator: " › ",
                usePathForSuiteName: "true",
            },
        ],
    ],
};
