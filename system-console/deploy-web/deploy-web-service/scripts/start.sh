#!/bin/bash

# 启动脚本：调用重启接口并启动服务

# 定义日志函数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}



# 定义重启接口配置
API_HOST="hydra-admin"
API_PORT="4445"
API_PATH="/admin/clients"
API_METHOD="PUT"
ClientID="c127f8c0-39da-4a8b-9b60-7540175a7b01"
ClientSecret="u8MOdN3rd5WZ"

# 定义OAuth相关的访问参数
# 注意：这些变量需要根据实际环境配置
access_scheme="https"
access_host="10.4.111.129"
access_port="443"
access_path=""

# 使用双引号确保变量被正确展开
# 构建完整的JSON请求体，包含所有需要的字段
API_BODY="{\"client_id\":\"${ClientID}\",\"client_name\":\"deploy-web\",\"client_secret\":\"${ClientSecret}\",\"redirect_uris\":[\"${access_scheme}://${access_host}:${access_port}${access_path}/interface/deployweb/oauth/login/callback\"],\"grant_types\":[\"authorization_code\",\"implicit\",\"refresh_token\"],\"response_types\":[\"token id_token\",\"code\",\"token\"],\"scope\":\"offline openid all\",\"post_logout_redirect_uris\":[\"${access_scheme}://${access_host}:${access_port}${access_path}/interface/deployweb/oauth/logout/callback\"],\"metadata\":{\"device\":{\"client_type\":\"deploy_web\"},\"login_form\":{\"third_party_login_visible\":false,\"remember_password_visible\":false,\"reset_password_visible\":false,\"sms_login_visible\":false}}}"

# 调用重启接口
log "开始调用注册client接口: http://${API_HOST}:${API_PORT}${API_PATH}/${ClientID}"

# 使用curl调用接口
curl -X ${API_METHOD} \
     -H "Content-Type: application/json" \
     -d "${API_BODY}" \
     "http://${API_HOST}:${API_PORT}${API_PATH}/${ClientID}"

# 检查接口调用结果
if [ $? -eq 0 ]; then
    log "注册client接口调用成功"
else
    log "注册client接口调用失败，但继续启动服务"
fi

# 启动主应用程序
log "开始启动主应用程序"
node /AnyShare/DeployWebService/build/bundle.js