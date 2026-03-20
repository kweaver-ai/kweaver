#!/usr/bin/env bash
# 兼容在非 bash 的 shell（如 sh/dash）里误执行的场景：
# - 若系统存在 bash，则自动用 bash 重新执行本脚本
# - 若不存在 bash，则给出明确报错并退出，避免后续出现“unexpected end of file”等误导性语法错误
if [ -z "${BASH_VERSION:-}" ]; then
  if command -v bash >/dev/null 2>&1; then
    exec bash "$0" "$@"
  fi
  echo "ERROR: 当前环境没有 bash，无法执行该脚本。" >&2
  echo "请在 Git Bash 或 WSL 中运行：bash ./setup_tem_db.sh" >&2
  exit 1
fi

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF_YAML="${ROOT_DIR}/conf/config.yaml"
SQL_FILE="${ROOT_DIR}/auto_cofig/dump-tem.sql"
CONFIG_ENV_FILE="${ROOT_DIR}/auto_cofig/config.env"

NAMESPACE_RESOURCE="${NAMESPACE_RESOURCE:-resource}"
SVC_NAME="${SVC_NAME:-mariadb-proton-mariadb}"
PORT_FORWARD_ADDR="${PORT_FORWARD_ADDR:-0.0.0.0}"
LOCAL_PORT="${LOCAL_PORT:-3320}"
REMOTE_PORT="${REMOTE_PORT:-3306}"

RDS_USER_DEFAULT="adp"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: 缺少命令：$1" >&2
    exit 1
  }
}

yaml_get_rds_field() {
  # 仅适配本项目当前 config.yaml 的缩进/结构（depServices -> rds -> field）
  local field="$1"
  awk -v field="$field" '
    BEGIN { in_dep=0; in_rds=0; }
    /^[[:space:]]*depServices:[[:space:]]*$/ { in_dep=1; next }
    in_dep && /^[[:space:]]{2}[a-zA-Z0-9_-]+:[[:space:]]*$/ && $1 !~ /^rds:$/ { in_rds=0 }
    in_dep && /^[[:space:]]{2}rds:[[:space:]]*$/ { in_rds=1; next }
    in_rds && $0 ~ "^[[:space:]]{4}" field ":" {
      line=$0
      sub("^[[:space:]]{4}" field ":[[:space:]]*", "", line)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
      gsub(/^'\''|'\''$/, "", line)
      gsub(/^"|"$/, "", line)
      print line
      exit
    }
  ' "$CONF_YAML" 2>/dev/null || true
}

cleanup() {
  if [[ -n "${PF_PID:-}" ]]; then
    kill "${PF_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

need_cmd kubectl
need_cmd awk
need_cmd grep

escape_squote() {
  # 将值安全写入单引号包裹的 env：abc'd -> abc'\''d
  local s="${1:-}"
  printf "%s" "$s" | sed "s/'/'\\\\''/g"
}

update_env_kv() {
  local file="$1"
  local key="$2"
  local val="$3"

  local esc
  esc="$(escape_squote "$val")"

  awk -v k="$key" -v v="$esc" '
    BEGIN { found=0 }
    $0 ~ ("^" k "=") { print k "='\''" v "'\''"; found=1; next }
    { print }
    END { if (!found) print k "='\''" v "'\''" }
  ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
}

detect_local_ip() {
  # 优先从路由判断出站 IP（最贴近"本机 IP"概念）
  local ip=""
  if command -v ip >/dev/null 2>&1; then
    ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')"
  fi
  if [[ -z "$ip" ]] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi
  if [[ -z "$ip" ]]; then
    # 兜底：取配置里的 accessAddress.host
    ip="$(awk '
      BEGIN { in_access=0 }
      /^[[:space:]]*accessAddress:[[:space:]]*$/ { in_access=1; next }
      in_access && /^[[:space:]]{2}host:[[:space:]]*/ {
        line=$0
        sub("^[[:space:]]{2}host:[[:space:]]*", "", line)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
        gsub(/^'\''|'\''$/, "", line)
        gsub(/^"|"$/, "", line)
        print line
        exit
      }
      in_access && /^[[:space:]]{2}[a-zA-Z0-9_-]+:[[:space:]]*/ && $1 !~ /^host:$/ { }
    ' "$CONF_YAML" 2>/dev/null || true)"
  fi
  printf "%s" "$ip"
}

if [[ ! -f "$CONF_YAML" ]]; then
  echo "ERROR: 找不到配置文件：$CONF_YAML" >&2
  exit 1
fi
if [[ ! -f "$SQL_FILE" ]]; then
  echo "ERROR: 找不到 SQL 文件：$SQL_FILE" >&2
  exit 1
fi
if [[ ! -f "$CONFIG_ENV_FILE" ]]; then
  echo "ERROR: 找不到配置文件：$CONFIG_ENV_FILE" >&2
  exit 1
fi

RDS_USER="$(yaml_get_rds_field user || true)"
RDS_PASSWORD_FROM_YAML="$(yaml_get_rds_field password || true)"
RDS_ROOT_PASSWORD_FROM_YAML="$(yaml_get_rds_field root_password || true)"
RDS_USER="${RDS_USER:-$RDS_USER_DEFAULT}"
RDS_PASSWORD="${RDS_PASSWORD:-$RDS_PASSWORD_FROM_YAML}"
RDS_ROOT_USER="${RDS_ROOT_USER:-root}"
RDS_ROOT_PASSWORD="${RDS_ROOT_PASSWORD:-$RDS_ROOT_PASSWORD_FROM_YAML}"

if [[ -z "${RDS_PASSWORD}" ]]; then
  echo "ERROR: 未获取到 rds 密码。" >&2
  echo "请在以下两种方式任选其一提供密码：" >&2
  echo "1) 在 ${CONF_YAML} 里填写 depServices.rds.password" >&2
  echo "2) 运行前设置环境变量：export RDS_PASSWORD='xxx'" >&2
  exit 1
fi

echo "检查 Service 是否存在：${SVC_NAME}（ns=${NAMESPACE_RESOURCE}）"
kubectl get svc "${SVC_NAME}" -n "${NAMESPACE_RESOURCE}" >/dev/null

echo "启动端口转发：${LOCAL_PORT}:${REMOTE_PORT}"
kubectl port-forward "svc/${SVC_NAME}" -n "${NAMESPACE_RESOURCE}" --address="${PORT_FORWARD_ADDR}" "${LOCAL_PORT}:${REMOTE_PORT}" >/dev/null 2>&1 &
PF_PID=$!
sleep 2

echo "查找 mariadb Pod（ns=${NAMESPACE_RESOURCE}）"
POD_NAME="$(
  kubectl get pod -n "${NAMESPACE_RESOURCE}" --no-headers 2>/dev/null \
    | grep -i mariadb \
    | awk 'NR==1{print $1}'
)"
if [[ -z "${POD_NAME}" ]]; then
  echo "ERROR: 未找到 mariadb Pod（请确认在 ${NAMESPACE_RESOURCE} 命名空间有 mariadb 相关 Pod）。" >&2
  exit 1
fi
echo "使用 Pod：${POD_NAME}"

echo "探测 Pod 内可用的数据库客户端（优先 mariadb，其次 mysql）"
DB_CLI="$(
  kubectl exec -n "${NAMESPACE_RESOURCE}" "${POD_NAME}" -- sh -lc '
    if command -v mariadb >/dev/null 2>&1; then
      echo mariadb
    elif command -v mysql >/dev/null 2>&1; then
      echo mysql
    else
      exit 1
    fi
  ' 2>/dev/null || true
)"
if [[ -z "${DB_CLI}" ]]; then
  echo "ERROR: Pod 内未找到 mariadb/mysql 客户端命令。" >&2
  echo "该镜像可能只包含服务端，不包含客户端；请换用带客户端的镜像或使用临时 client Pod 导入。" >&2
  exit 1
fi
echo "使用客户端：${DB_CLI}"

if [[ "${RDS_USER}" != "${RDS_ROOT_USER}" ]]; then
  if [[ -z "${RDS_ROOT_PASSWORD}" ]]; then
    echo "ERROR: 当前用户（${RDS_USER}）无权限创建数据库 tem，且未提供 root 密码用于授权。" >&2
    echo "请在 ${CONF_YAML} 配置 depServices.rds.root_password，或运行前设置环境变量：" >&2
    echo "export RDS_ROOT_PASSWORD='xxx'" >&2
    exit 1
  fi

  echo "使用 root 创建数据库 tem 并授予 ${RDS_USER} 权限"
  kubectl exec -n "${NAMESPACE_RESOURCE}" "${POD_NAME}" -- sh -lc \
    "${DB_CLI} -u '${RDS_ROOT_USER}' -p'${RDS_ROOT_PASSWORD}' -e \"CREATE DATABASE IF NOT EXISTS tem DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci; CREATE USER IF NOT EXISTS '${RDS_USER}'@'%' IDENTIFIED BY '${RDS_PASSWORD}'; GRANT ALL PRIVILEGES ON tem.* TO '${RDS_USER}'@'%'; FLUSH PRIVILEGES;\""
else
  echo "使用 ${RDS_USER} 创建数据库 tem"
  kubectl exec -n "${NAMESPACE_RESOURCE}" "${POD_NAME}" -- sh -lc \
    "${DB_CLI} -u '${RDS_USER}' -p'${RDS_PASSWORD}' -e \"CREATE DATABASE IF NOT EXISTS tem DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;\""
fi

echo "在 Pod 内导入 SQL（stdin -> ${DB_CLI} tem）"
kubectl exec -i -n "${NAMESPACE_RESOURCE}" "${POD_NAME}" -- sh -lc \
  "${DB_CLI} -u '${RDS_USER}' -p'${RDS_PASSWORD}' tem" < "${SQL_FILE}"

echo "校验数据库 tem 是否存在、表数量是否 > 0"
kubectl exec -n "${NAMESPACE_RESOURCE}" "${POD_NAME}" -- sh -lc \
  "${DB_CLI} -u '${RDS_USER}' -p'${RDS_PASSWORD}' -N -e \"SHOW DATABASES LIKE 'tem';\" | grep -x tem"

TABLE_COUNT="$(
  kubectl exec -n "${NAMESPACE_RESOURCE}" "${POD_NAME}" -- sh -lc \
    "${DB_CLI} -u '${RDS_USER}' -p'${RDS_PASSWORD}' -N -e \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='tem';\""
)"
echo "tem 表数量：${TABLE_COUNT}"

if [[ "${TABLE_COUNT}" -eq 0 ]]; then
  echo "ERROR: tem 数据库表数量为 0，可能导入失败。" >&2
  exit 1
fi

echo "写入 ${CONFIG_ENV_FILE}（替换 DS_HOST/DS_USERNAME/DS_PASSWORD 默认值）"
LOCAL_IP="$(detect_local_ip)"
if [[ -z "${LOCAL_IP}" ]]; then
  echo "WARN: 未获取到本机 IP，将不修改 DS_HOST。" >&2
else
  update_env_kv "${CONFIG_ENV_FILE}" "DS_HOST" "${LOCAL_IP}"
fi
update_env_kv "${CONFIG_ENV_FILE}" "DS_USERNAME" "${RDS_USER}"
update_env_kv "${CONFIG_ENV_FILE}" "DS_PASSWORD" "${RDS_PASSWORD}"

echo "完成：tem 数据库已创建并导入成功。"
