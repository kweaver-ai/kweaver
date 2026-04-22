#!/usr/bin/env bash
# =============================================================================
# KWeaver onboard: model registration + BKN ConfigMap (sourced by onboard.sh)
# =============================================================================

onboard_log_info() { echo -e "${GREEN}[onboard]${NC} $*"; }
onboard_log_warn() { echo -e "${YELLOW}[onboard]${NC} $*"; }
onboard_log_err() { echo -e "${RED}[onboard]${NC} $*"; }

# ---- JSON: extract all model_name values (API list response) ----
onboard_list_model_names() {
    python3 -c '
import json, sys

def walk(o, out):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "model_name" and isinstance(v, str):
                out.add(v)
            else:
                walk(v, out)
    elif isinstance(o, list):
        for x in o:
            walk(x, out)

j = json.load(sys.stdin)
out = set()
walk(j, out)
for n in sorted(out):
    print(n)
' 2>/dev/null
}

onboard_get_existing_llm_names() {
    kweaver call "/api/mf-model-manager/v1/llm/list?page=1&size=500" 2>/dev/null | onboard_list_model_names
}

onboard_get_existing_small_model_names() {
    kweaver call "/api/mf-model-manager/v1/small-model/list?page=1&size=500" 2>/dev/null | onboard_list_model_names
}

# Args: model_name, model_series, max_model_len, api_key, api_model, api_url, [model_type]
onboard_ensure_llm() {
    local name="$1" series="$2" mlen="$3" akey="$4" amodel="$5" aurl="$6"
    local mtype="${7:-llm}"
    if printf '%s\n' "${_POSTI_EXISTING_LLM}" | grep -qFx "${name}"; then
        onboard_log_info "LLM already registered, skip: ${name}"
        return 0
    fi
    local body
    body=$(
        python3 -c '
import json, sys
j = {
  "model_name": sys.argv[1],
  "model_series": sys.argv[2],
  "max_model_len": int(sys.argv[3]),
  "model_type": sys.argv[7],
  "model_config": {
    "api_key": sys.argv[4],
    "api_model": sys.argv[5],
    "api_url": sys.argv[6]
  }
}
print(json.dumps(j))
' "${name}" "${series}" "${mlen}" "${akey}" "${amodel}" "${aurl}" "${mtype}" 2>/dev/null
    ) || {
        onboard_log_err "Failed to build LLM json"
        return 1
    }

    if kweaver call /api/mf-model-manager/v1/llm/add -d "${body}"; then
        onboard_log_info "Registered LLM: ${name}"
    else
        onboard_log_err "Failed to register LLM: ${name}"
        return 1
    fi
    _POSTI_EXISTING_LLM="${_POSTI_EXISTING_LLM}
${name}"
}

# Args: name, type, api_key, api_url, api_model, batch, max_tok, emb_dim
onboard_ensure_small_model() {
    local name="$1" stype="$2" akey="$3" aurl="$4" amodel="$5" batch="${6:-32}" maxtok="${7:-512}" embdim="${8:-1024}"
    if printf '%s\n' "${_POSTI_EXISTING_SM}" | grep -qFx "${name}"; then
        onboard_log_info "Small model already registered, skip: ${name}"
        return 0
    fi
    local body
    body=$(
        python3 -c '
import json, sys
j = {
  "model_name": sys.argv[1],
  "model_type": sys.argv[2],
  "model_config": {
    "api_key": sys.argv[3],
    "api_url": sys.argv[4],
    "api_model": sys.argv[5]
  },
  "batch_size": int(sys.argv[6]),
  "max_tokens": int(sys.argv[7])
}
t = j["model_type"]
if t == "embedding" and len(sys.argv) > 8 and sys.argv[8] not in ("", "0"):
    j["embedding_dim"] = int(sys.argv[8])
print(json.dumps(j))
' "${name}" "${stype}" "${akey}" "${aurl}" "${amodel}" "${batch}" "${maxtok}" "${embdim}" 2>/dev/null
    ) || {
        onboard_log_err "Failed to build small-model json"
        return 1
    }

    if kweaver call /api/mf-model-manager/v1/small-model/add -d "${body}"; then
        onboard_log_info "Registered small model: ${name} (${stype})"
    else
        onboard_log_err "Failed to register small model: ${name}"
        return 1
    fi
    _POSTI_EXISTING_SM="${_POSTI_EXISTING_SM}
${name}"
}

onboard_get_id_for_llm() {
    local mname="$1"
    kweaver call "/api/mf-model-manager/v1/llm/list?page=1&size=500" 2>/dev/null | python3 -c "
import json, sys
n = sys.argv[1]
j = json.load(sys.stdin)

def find(o):
    if isinstance(o, dict):
        if o.get('model_name') == n and o.get('model_id'):
            print(o['model_id'])
            return True
        for v in o.values():
            if find(v):
                return True
    elif isinstance(o, list):
        for x in o:
            if find(x):
                return True
    return False

find(j)
" "${mname}" 2>/dev/null | head -1
}

onboard_get_id_for_small() {
    local mname="$1"
    kweaver call "/api/mf-model-manager/v1/small-model/list?page=1&size=500" 2>/dev/null | python3 -c "
import json, sys
n = sys.argv[1]
j = json.load(sys.stdin)

def find(o):
    if isinstance(o, dict):
        if o.get('model_name') == n and o.get('model_id'):
            print(o['model_id'])
            return True
        for v in o.values():
            if find(v):
                return True
    elif isinstance(o, list):
        for x in o:
            if find(x):
                return True
    return False

find(j)
" "${mname}" 2>/dev/null | head -1
}

onboard_test_llm() {
    local mid="$1"
    [[ -z "${mid}" ]] && return 0
    if kweaver call /api/mf-model-manager/v1/llm/test -d "{\"model_id\": \"${mid}\"}" 2>/dev/null; then
        onboard_log_info "LLM test ok for id ${mid}"
    else
        onboard_log_warn "LLM test failed for id ${mid} (check upstream / network)"
    fi
}

onboard_test_small() {
    local mid="$1"
    [[ -z "${mid}" ]] && return 0
    if kweaver call /api/mf-model-manager/v1/small-model/test -d "{\"model_id\": \"${mid}\"}" 2>/dev/null; then
        onboard_log_info "Small model test ok for id ${mid}"
    else
        onboard_log_warn "Small model test failed for id ${mid}"
    fi
}

# Apply embedded YAML in ConfigMap (bkn-backend-cm, ontology-query-cm); see helm *-config.yaml keys
onboard_upsert_cm_embedded_yaml() {
    local ns="$1" cmname="$2" dname="$3" # ymlkey optional 4th not needed — auto-detect

    if ! kubectl get "cm/${cmname}" -n "${ns}" &>/dev/null; then
        onboard_log_err "ConfigMap ${cmname} not found in ${ns}"
        return 1
    fi

    local jtmp
    jtmp="$(mktemp)"
    kubectl get "cm/${cmname}" -n "${ns}" -o json > "${jtmp}" || {
        rm -f "${jtmp}"
        return 1
    }

    if ! OUT_JSON=$(
        python3 - "${jtmp}" "${dname}" <<'PY'
import json, subprocess, sys

try:
    import yaml
except ImportError:
    print("python3: pip3 install pyyaml (or install yq for yaml transforms)", file=sys.stderr)
    sys.exit(2)


def yq_subprocess_ok():
    try:
        r = subprocess.run(
            ["yq", "--version"],
            capture_output=True,
            check=True,
            timeout=4,
        )
        return r.returncode == 0
    except Exception:
        return False


path, dname = sys.argv[1], sys.argv[2]
with open(path) as f:
    j = json.load(f)
data = j.get("data") or {}
if not data:
    print("ConfigMap has empty data", file=sys.stderr)
    sys.exit(1)

# choose *-config.yaml
usekey = None
for k in data:
    if k.endswith("-config.yaml"):
        usekey = k
        break
if not usekey:
    for k in data:
        if k.endswith(".yaml"):
            usekey = k
            break
if not usekey:
    usekey = list(data.keys())[0]

raw = data.get(usekey) or ""
if not str(raw).strip():
    print("empty yaml in key", usekey, file=sys.stderr)
    sys.exit(1)

if yq_subprocess_ok():
    p = subprocess.run(
        [
            "yq",
            f".server.defaultSmallModelEnabled = true | .server.defaultSmallModelName = \"{dname}\"",
        ],
        input=raw.encode("utf-8", errors="replace"),
        capture_output=True,
    )
    if p.returncode != 0:
        print(p.stderr.decode(errors="replace"), file=sys.stderr)
        sys.exit(1)
    newyml = p.stdout.decode("utf-8", errors="replace")
else:
    c = yaml.safe_load(raw) or {}
    c.setdefault("server", {})
    c["server"]["defaultSmallModelEnabled"] = True
    c["server"]["defaultSmallModelName"] = dname
    newyml = yaml.dump(
        c, default_flow_style=False, allow_unicode=True, sort_keys=False
    )

j["data"][usekey] = newyml
j.pop("status", None)
md = j.get("metadata", {})
if md:
    for k in list(md.keys()):
        if k in ("uid", "resourceVersion", "selfLink", "managedFields", "creationTimestamp", "generation", "deletionTimestamp"):
            try:
                del md[k]
            except KeyError:
                pass
print(json.dumps(j))
PY
    ); then
        rm -f "${jtmp}"
    else
        local rc=$?
        rm -f "${jtmp}"
        onboard_log_err "Failed to build patched ConfigMap JSON for ${cmname} (yq or PyYAML required)"
        return "${rc}"
    fi

    echo "${OUT_JSON}" | kubectl apply -f - || return 1
    onboard_log_info "Applied ${cmname}: defaultSmallModelName=${dname}"
    return 0
}

# Restart BKN / ontology-query after ConfigMap change
onboard_bkn_rollout() {
    local ns="$1"
    kubectl rollout restart "deployment/bkn-backend" -n "${ns}" 2>/dev/null || onboard_log_warn "deployment/bkn-backend missing or not restartable"
    kubectl rollout restart "deployment/ontology-query" -n "${ns}" 2>/dev/null || onboard_log_warn "deployment/ontology-query missing or not restartable"
    kubectl rollout status "deployment/bkn-backend" -n "${ns}" --timeout=300s 2>/dev/null || true
    kubectl rollout status "deployment/ontology-query" -n "${ns}" --timeout=300s 2>/dev/null || true
    onboard_log_info "Rollout signalled for bkn-backend and ontology-query"
}
