import { src, dest } from "gulp";
import { useTemplate } from "../../plugins";
import header from "gulp-header";
import rename from "gulp-rename";
import { UseTemplatePluginOptions } from "../../plugins/useTemplate";

export interface GenerateComponentOptions extends UseTemplatePluginOptions {
    from: string[];
    toDir: string;
    banner?: string;
}

export const generateComponent = ({ from, toDir, template, mapToInterpolate, banner = "" }: GenerateComponentOptions) =>
    function GenerateEntry() {
        return src(from)
            .pipe(
                useTemplate({
                    template,
                    mapToInterpolate
                })
            )
            .pipe(header(banner))
            .pipe(rename({ extname: ".tsx" }))
            .pipe(dest(toDir));
    };
