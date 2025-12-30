import logger from "../common/logger";
import { configData, fetchParse } from "../handlers/tools";

export const registryClient = async () => {
    const clientID = "c127f8c0-39da-4a8b-9b60-7540175a7b01";
    const clientSecret = "u8MOdN3rd5WZ";
    const { hydra } = configData.Module2Config;
    const access_scheme = "https";
    const access_host = "10.4.111.129";
    const access_port = "443";
    const access_path = "";
    const payload = {
        client_id: clientID,
        client_name: "deploy-web",
        client_secret: clientSecret,
        redirect_uris: [
            `${access_scheme}://${access_host}:${access_port}${access_path}/interface/deployweb/oauth/login/callback`,
        ],
        grant_types: ["authorization_code", "implicit", "refresh_token"],
        response_types: ["token id_token", "code", "token"],
        scope: "offline openid all",
        post_logout_redirect_uris: [
            `${access_scheme}://${access_host}:${access_port}${access_path}/interface/deployweb/oauth/logout/callback`,
        ],
        metadata: {
            device: {
                client_type: "deploy_web",
            },
            login_form: {
                third_party_login_visible: false,
                remember_password_visible: false,
                reset_password_visible: false,
                sms_login_visible: false,
            },
        },
    };
    try {
        logger.info("开始调用注册客户端接口");
        await fetchParse(
            `${hydra.protocol}://${hydra.administrativeHost}:${hydra.administrativePort}/admin/clients`,
            {
                timeout: 1000 * 6,
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
        logger.info("调用注册客户端接口成功");
    } catch (e) {
        logger.info("调用注册客户端接口失败");
        logger.info(e);
        logger.info(JSON.stringify(e));
        throw e;
    }
};
