import {
    Keys,
    Modules,
    Languages as MLanguages,
} from "../../api/module-config";
import {
    getLanguageList,
    getEnvLanguage,
    setLanguage,
    Languages,
} from "../../core/language";
import { getCurrentLang } from "../../core/mediator";
import WebComponent from "../webcomponent";
import { Props, State } from "./index.d";

export default class LanguageBase extends WebComponent<Props, State> {
    static defaultProps = {
        isInstallMainModule: false,
    };

    state = {
        languageList: [],
        currentLang: "",
    };

    componentDidMount() {
        this.getLanguageConfig();
    }

    /**
     * 获取语言资源选项
     * status: 应用服务是否可用 | 是否是ConsoleindexView
     */
    async getLanguageConfig() {
        const { moduleConfigs } = this.props;
        let softwareType;

        try {
            const {
                device_info: { software_type },
            } = { device_info: { software_type: "ASE" } };
            softwareType = software_type;
            await getCurrentLang();
        } catch (error) {}

        try {
            const moduleConfigsLanguages =
                moduleConfigs &&
                moduleConfigs[Modules.Languages] &&
                moduleConfigs[Modules.Languages][Keys.Config]
                    ? moduleConfigs[Modules.Languages][Keys.Config]
                    : MLanguages[Keys.Config];
            let langs = status
                ? await getLanguageList(softwareType)
                : Languages;
            langs = langs.filter((item: any) => {
                return moduleConfigsLanguages.includes(item.language);
            });
            this.setState({
                languageList: langs,
                currentLang: getEnvLanguage(),
            });
        } catch (error) {}
    }

    /**
     * 切换语言
     */
    protected switchLanguages(language: string) {
        setLanguage(language);
        location.reload();
        this.setState({
            currentLang: language,
        });
    }
}
