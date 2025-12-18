import { series, parallel } from "gulp";
import { clean, copy, generateIcons, generateEntry, generateInline } from "./tasks/creators";
import { generalConfig, remainFillConfig } from "./plugins/svgo/presets";
import { assignAttrsAtTag, setDefaultColorAtPathTag } from "./plugins/svg2Definition/transforms";
import { twotoneStringify } from "./plugins/svg2Definition/stringify";
import { readFileSync } from "fs";
import { resolve } from "path";
import { getIdentifier } from "./utils";
import { IconDefinition } from "./templates/types";
import { ExtractRegExp } from "./tasks/creators/generateInline";
import { generateComponent } from "./tasks/creators/generateComponent";

const iconTemplate = readFileSync(resolve(__dirname, "./templates/icon.ts.ejs"), "utf8");

export default series(
    // 1. clean
    clean(["src", "inline-svg", "es", "lib"]),

    parallel(
        // 2.1 copy helpers.ts, types.ts
        copy({
            from: ["templates/**/*.ts", "templates/**/*.tsx"],
            toDir: "src"
        }),

        // 2.2 generate abstract node with the theme "filled"
        generateIcons({
            theme: "filled",
            from: ["svg/filled/*.svg"],
            toDir: "src/asn",
            svgoConfig: generalConfig,
            extraNodeTransformFactories: [assignAttrsAtTag("svg", { focusable: "false" })],
            stringify: JSON.stringify,
            template: iconTemplate,
            mapToInterpolate: ({ name, content }) => ({
                identifier: getIdentifier({ name, themeSuffix: "Filled" }),
                content
            }),
            filename: ({ name }) => getIdentifier({ name, themeSuffix: "Filled" })
        }),

        // 2.2 generate abstract node with the theme "outlined"
        generateIcons({
            theme: "outlined",
            from: ["svg/outlined/*.svg"],
            toDir: "src/asn",
            svgoConfig: generalConfig,
            extraNodeTransformFactories: [assignAttrsAtTag("svg", { focusable: "false" })],
            stringify: JSON.stringify,
            template: iconTemplate,
            mapToInterpolate: ({ name, content }) => ({
                identifier: getIdentifier({ name, themeSuffix: "Outlined" }),
                content
            }),
            filename: ({ name }) => getIdentifier({ name, themeSuffix: "Outlined" })
        }),

        // 2.3 generate abstract node with the theme "outlined"
        generateIcons({
            theme: "twotone",
            from: ["svg/twotone/*.svg"],
            toDir: "src/asn",
            svgoConfig: remainFillConfig,
            extraNodeTransformFactories: [
                assignAttrsAtTag("svg", { focusable: "false" }),
                setDefaultColorAtPathTag("#333")
            ],
            stringify: twotoneStringify,
            template: iconTemplate,
            mapToInterpolate: ({ name, content }) => ({
                identifier: getIdentifier({ name, themeSuffix: "TwoTone" }),
                content
            }),
            filename: ({ name }) => getIdentifier({ name, themeSuffix: "TwoTone" })
        }),

        generateIcons({
            theme: "colored",
            from: ["svg/colored/*.svg"],
            toDir: "src/asn",
            svgoConfig: remainFillConfig,
            extraNodeTransformFactories: [assignAttrsAtTag("svg", { focusable: "false" })],
            stringify: JSON.stringify,
            template: iconTemplate,
            mapToInterpolate: ({ name, content }) => ({
                identifier: getIdentifier({ name, themeSuffix: "Colored" }),
                content
            }),
            filename: ({ name }) => getIdentifier({ name, themeSuffix: "Colored" })
        })
    ),
    parallel(
        // 3.1 generate icon
        generateComponent({
            from: ["src/asn/*.ts"],
            toDir: "src/icons",
            banner: "// This index.ts file is generated automatically.\n",
            template: `
import * as React from 'react'
import <%= identifier %>Svg from '<%= path %>';
import Icon, { IconProps } from '../components/Icon'

const <%= identifier %> = (
  props: IconProps,
  ref: React.Ref<HTMLSpanElement>,
) => <Icon {...props} ref={ref} icon={<%= identifier %>Svg} />;

<%= identifier %>.displayName = '<%= identifier %>';
export default React.forwardRef<HTMLSpanElement, IconProps>(<%= identifier %>);`,
            mapToInterpolate: ({ name: identifier }) => ({
                identifier,
                path: `../asn/${identifier}`
            })
        }),

        // 3.2 generate inline SVG files
        generateInline({
            from: ["src/asn/*.ts"],
            toDir: ({ _meta }) => `inline-svg/${_meta && _meta.theme}`,
            getIconDefinitionFromSource: (content: string): IconDefinition => {
                const extract = ExtractRegExp.exec(content);
                if (extract === null || !extract[1]) {
                    throw new Error("Failed to parse raw icon definition: " + content);
                }
                return new Function(`return ${extract[1]}`)() as IconDefinition;
            }
        }),
        // 3.3 generate inline SVG files with namespace
        generateInline({
            from: ["src/asn/*.ts"],
            toDir: ({ _meta }) => `inline-namespaced-svg/${_meta && _meta.theme}`,
            getIconDefinitionFromSource: (content: string): IconDefinition => {
                const extract = ExtractRegExp.exec(content);
                if (extract === null || !extract[1]) {
                    throw new Error("Failed to parse raw icon definition: " + content);
                }
                return new Function(`return ${extract[1]}`)() as IconDefinition;
            },
            renderOptions: {
                extraSVGAttrs: { xmlns: "http://www.w3.org/2000/svg" }
            }
        })
    ),

    generateEntry({
        entryName: "index.ts",
        from: ["src/icons/*.tsx"],
        toDir: "src",
        banner: `// This index.ts file is generated automatically.
`,
        template: `export { default as <%= identifier %> } from '<%= path %>';`,
        mapToInterpolate: ({ name: identifier }) => ({
            identifier,
            path: `./icons/${identifier}`
        })
    })
);
