import { session } from "../../core/mediator";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../../core/url";
import { generateRandom } from "../../core/random";
import { Languages } from "../../core/language";
import WebComponent from "../webcomponent";
import { signup } from "../../core/auth";
import { Props, State } from "./index.d";
import { LoginError } from "./helper";
import Cookies from "js-cookie";
import __ from "./locale";

export default class LoginClusterBase extends WebComponent<Props, State> {
    state = {
        logo: "",
        loginError: "",
        iframeVisible: false,
    };

    prefix = "";

    componentDidMount() {
        const prefix = URLPrefixFormatter(
            Cookies.get("X-Forwarded-Prefix") || "",
            URL_PREFIX_MODE.tail
        );
        const { lang } = this.props;
        const random = generateRandom(10);
        this.prefix = prefix;
        setTimeout(() => {
            if (this.refs.select) {
                (this.refs.select as any).src = `${
                    prefix ? prefix : ""
                }/interface/studioweb/login?lang=${
                    lang ? lang : Languages[0].language
                }&state=${random}&x-forwarded-prefix=${prefix}&integrated=${window.location.search.includes(
                    "redirect=true"
                )}&product=adp&_t=${new Date().getTime()}`;
            }
            localStorage.setItem("oauth.signin.client.id", random);
        }, 0);
        this.listenWindow(lang, random);
    }

    /**
     * 监听tab标签变化
     * @params lang 语言
     * @params host ip
     * @params port 端口
     * @params random 随机数
     */
    protected listenWindow(lang: string, random: string) {
        let visibilityChange = "";
        if (typeof document.hidden !== "undefined") {
            // Opera 12.10 and Firefox 18 and later support
            visibilityChange = "visibilitychange";
        } else if (typeof (document as any).msHidden !== "undefined") {
            visibilityChange = "msvisibilitychange";
        } else if (typeof (document as any).webkitHidden !== "undefined") {
            visibilityChange = "webkitvisibilitychange";
        }
        document.addEventListener(visibilityChange, async () => {
            if (
                document.visibilityState === "visible" &&
                random !== localStorage.getItem("oauth.signin.client.id")
            ) {
                if (Cookies.get("studio.oauth2_token")) {
                    window.location.reload();
                    return;
                }
                if (this.refs.select) {
                    (this.refs.select as any).src = `${
                        this.prefix ? this.prefix : ""
                    }/interface/studioweb/login?lang=${
                        lang ? lang : Languages[0].language
                    }&state=${random}&x-forwarded-prefix=${
                        this.prefix
                    }&integrated=${window.location.search.includes(
                        "redirect=true"
                    )}&product=adp&_t=${new Date().getTime()}`;
                }
                localStorage.setItem("oauth.signin.client.id", random);
            }
        });
    }

    /**
     * 获取iframe错误
     */
    protected catchIFrameError({ target }: any) {
        try {
            this.setState({ iframeVisible: false });
            const loginError = session.take("studio.loginerror");
            if (loginError) {
                this.setState({
                    loginError: loginError,
                });
            } else if (
                target &&
                target.contentDocument &&
                target.contentDocument.body
            ) {
                const errText = "503 Service Temporarily Unavailable";
                const { innerText, outerHTML, outerText, textContent } =
                    target.contentDocument.body;
                if (
                    [innerText, outerHTML, outerText, textContent].some(
                        (text) => {
                            return text.indexOf(errText) !== -1;
                        }
                    )
                ) {
                    this.setState({ loginError: LoginError.Error });
                    setTimeout(() => {
                        signup();
                    }, 3000);
                } else {
                    this.setState({ loginError: "" });
                }
            } else {
                if (target && target.contentDocument === null) {
                    this.setState({ loginError: LoginError.Error });
                    setTimeout(() => {
                        signup();
                    }, 3000);
                } else {
                    this.setState({ loginError: "" });
                }
            }
        } catch (e) {
        } finally {
            this.setState({ iframeVisible: true });
        }
    }
}
