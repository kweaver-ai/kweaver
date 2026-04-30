# macOS dev path (`dev/mac.sh`, kind)

**Audience:** Optional for **macOS developers** doing quick validation. **Production deployments and all primary documentation assume Linux** — start with [`deploy/README.md`](../README.md) and [`help/en/install.md`](../../help/en/install.md) / [`help/zh/install.md`](../../help/zh/install.md).

English | [中文](#中文说明)

Local Kubernetes with **kind** plus the same Helm charts as Linux `deploy.sh`. No host `preflight` / k3s / kubeadm.

### Repository (clone first)

Scripts and vendored manifests live in the repo tree — **`mac.sh` is not a standalone installer.** Clone **[kweaver-ai/kweaver-core](https://github.com/kweaver-ai/kweaver-core)** (check out the branch you deploy from, e.g. `feature/deploy/k3s-module`), then **`cd`** into **`deploy/`** before any command below:

```bash
git clone https://github.com/kweaver-ai/kweaver-core.git
cd kweaver-core/deploy   # always run bash ./dev/mac.sh ... from this directory
```

Same layout applies if your product tarball extracts to a **`kweaver-core/`** root with a **`deploy/`** subdirectory.

### Architecture (Apple Silicon / arm64)

On **Apple Silicon** Macs, kind nodes are **linux/arm64** by default. Charts pull from `image.registry` in your [`dev/conf/mac-config.yaml`](conf/mac-config.yaml) (copy from [`mac-config.yaml.example`](conf/mac-config.yaml.example)); those images must be **arm64-capable** (multi-arch manifest or an arm64 tag). If a registry only ships **amd64**, pods often fail with *exec format error*. Intel Macs still get **amd64** kind nodes unless you force another platform.

### Access URL (HTTP and automatic host)

- **HTTP vs HTTPS:** HTTPS uses TLS to encrypt traffic and verify the server identity; HTTP is unencrypted. On a trusted LAN, HTTP avoids dealing with local TLS certs and is typical for dev. Browsers may still show “Not secure” for HTTP — expected.
- **Automatic IP:** Your `mac-config.yaml` uses `accessAddress.scheme: http` and may **omit** `host` (see the example file). On `kweaver-core install`, the flow detects your LAN IP (on macOS, usually the default-route interface) and writes it into values so other devices on the network can open the UI. Set `accessAddress.host` yourself (for example `localhost`) if you want same-machine-only URLs.

## Order of operations

Run from the **`deploy/`** directory (`cd deploy` in this repo). Invoke **`mac.sh` with bash** (e.g. `bash ./dev/mac.sh ...`). **`kweaver-core` / `core`:** the wrapper **defaults to `--minimum`** (smaller chart set; skips ISF in manifest terms). Pass **`--full`** for the full manifest profile (adds ISF download/install when the manifest enables it).

| Step | Command | Required? |
|------|---------|-----------|
| 1 | `bash ./dev/mac.sh doctor` | Recommended |
| 2 | `bash ./dev/mac.sh doctor --fix` (or `-y doctor --fix`) | If something is missing |
| 3 | `bash ./dev/mac.sh cluster up` | **Yes** before install |
| 4 | `bash ./dev/mac.sh data-services install` | Optional — only to install/refresh **data layer alone**; **`kweaver-core install` invokes the same bundled install first** (`KWEAVER_SKIP_DATA_SERVICES_BUNDLE=true` skips it). |
| 5 | `bash ./dev/mac.sh kweaver-core download` | Optional (local chart cache; **minimum** by default) |
| 6 | `bash ./dev/mac.sh kweaver-core install` | **Yes** — deploy Core (**`--minimum` implied**); runs bundled data-services beforehand unless skipped |
| 7 | `bash ./dev/mac.sh onboard` | Optional (models/BKN; needs `kweaver` CLI; add `-y` to skip prompts) |

Optional (same `deploy.sh` Helm paths as Linux; you need a working cluster + values that match your dependencies): `bash ./dev/mac.sh isf install|download|uninstall|status`, `bash ./dev/mac.sh etrino install|...` (Vega stack; **`vega` is an alias of `etrino`**). ISF may require DB/config beyond the minimal mac sample—see Linux `deploy.sh` help and your `CONFIG_YAML_PATH`.

**Minimal path:** `cluster up` → `kweaver-core install` (wrapper implies `--minimum` and runs **data-services** first). If you skip that bundle (`KWEAVER_SKIP_DATA_SERVICES_BUNDLE=true`), you must provide reachable DB/Kafka/etc. yourself or run **`data-services install`** beforehand.

**Teardown:** Optionally `bash ./dev/mac.sh data-services uninstall` (tear down MariaDB/Redis/Kafka/ZK/OpenSearch Helm releases; keeps kind), then `bash ./dev/mac.sh cluster down` (deletes the cluster).

Config: copy [`dev/conf/mac-config.yaml.example`](conf/mac-config.yaml.example) to **`dev/conf/mac-config.yaml`** (one-time). The real **`mac-config.yaml` is gitignored** so generated passwords are not committed; adjust `accessAddress` and registry as needed.  
`kweaver-dip` is not wired in `mac.sh` (use Linux `deploy.sh`).

See also: top-of-file comments in [`mac.sh`](mac.sh), `bash ./dev/mac.sh -h`.

### Troubleshooting

- **`failed to connect to the docker API` / `docker.sock: no such file` when running `cluster up`:** the Docker **CLI** is installed but the **engine** is not running. Open **Docker Desktop**, wait until it is fully started, run `docker info` to confirm, then retry `cluster up`. `doctor` also checks engine reachability. **`doctor --fix` does not start Docker** (Homebrew only installs the CLI/cask); if everything else is already installed, just start Desktop and re-run `doctor`.

- **`kweaver-core-data-migrator` / pre-install job `BackoffLimitExceeded`:** ensure the **data layer** is up (normally automatic with **`kweaver-core install`**; otherwise run **`bash ./dev/mac.sh data-services install`**). Ensure **`depServices.rds`** points at in-cluster MariaDB after install (`mac-config` loopback placeholders may be updated when MariaDB is installed). Remove a failed release if Helm left it pending: `helm uninstall kweaver-core-data-migrator -n <namespace>` then re-run `kweaver-core install`.

---

## 中文说明

### 克隆仓库（先做好）

脚本与内置清单都在仓库目录里 **`mac.sh` 不能脱离仓库单独用。**请先 **clone [kweaver-ai/kweaver-core](https://github.com/kweaver-ai/kweaver-core)**（切换到你要部署的分支，例如 `feature/deploy/k3s-module`），再进入 **`deploy/`**，后续命令都在该目录执行：

```bash
git clone https://github.com/kweaver-ai/kweaver-core.git
cd kweaver-core/deploy   # 必须在含有 deploy.sh 的这一层执行 bash ./dev/mac.sh ...
```

若使用发布包解压后的目录结构，只要存在 **`deploy/`** 且路径与上文一致即可。

在 **`deploy/`** 目录下执行（例如 `cd deploy`）。请用 **bash** 调用：`bash ./dev/mac.sh ...`。**`kweaver-core` / `core`** 默认会加上 **`--minimum`**（精简 chart、按 manifest 跳过 ISF）；需要完整依赖时用 **`--full`**。

**推荐顺序：**

1. `bash ./dev/mac.sh doctor` — 检查环境（可选但建议）。  
2. `bash ./dev/mac.sh doctor --fix` — 缺工具时用 Homebrew 安装（可加 `-y` 跳过确认）。  
3. `bash ./dev/mac.sh cluster up` — **必须先有集群**（kind + ingress）。  
4. `bash ./dev/mac.sh data-services install` — **可选**；仅单独装/刷新数据层。**`kweaver-core install` 会先跑同一套 `ensure_data_services`**（可用 `KWEAVER_SKIP_DATA_SERVICES_BUNDLE=true` 跳过）。  
5. `bash ./dev/mac.sh kweaver-core download` — **可选**，只下载 chart。  
6. `bash ./dev/mac.sh kweaver-core install` — **装 Core**（默认 **`--minimum`**；先确保数据层，`--full` 全量时可加）  
7. `bash ./dev/mac.sh onboard` — **可选**（可加 `-y`）。

**可选：**`bash ./dev/mac.sh isf ...`、`bash ./dev/mac.sh etrino ...`（Vega 三套件；**`vega` 为 `etrino` 别名**）。ISF 通常对数据库/配置有更多要求，请结合 Linux 侧 `deploy.sh` 与你的 `CONFIG_YAML_PATH`。**未接入：**`kweaver-dip`。

**最短路径：**`cluster up` → `kweaver-core install`（封装默认 **`--minimum`**，且**先装数据层**）。若显式跳过捆绑数据层，需自备中间件或事先跑 **`data-services install`**。  

**删除本机 kind：**可先 `bash ./dev/mac.sh data-services uninstall`（只卸数据层 Helm，保留 kind），再 `bash ./dev/mac.sh cluster down`（删掉整个 kind 集群）。

**架构：**Apple Silicon 上 kind 节点一般为 **linux/arm64**，镜像需支持 arm64/多架构（见上节及本地 `dev/conf/mac-config.yaml` / 示例中的 `image.registry`）。仅 amd64 的镜像在 arm64 节点上常会 *exec format error*。

**配置：**将 [`dev/conf/mac-config.yaml.example`](conf/mac-config.yaml.example) 复制为 **`dev/conf/mac-config.yaml`**。**`mac-config.yaml` 已加入 .gitignore**，避免把 `data-services install` 生成的口令提交进仓库。  
**访问地址：**默认 **HTTP**（`accessAddress.scheme: http`，端口与 `mac-config` 一致）。**不写 `host`** 时，安装流程会**自动探测本机局域网 IP**（macOS 上多为默认路由网卡），便于同网段其它机器访问；若只要本机访问，可在 `mac-config` 里显式设 `accessAddress.host: localhost`。**HTTPS** 需 TLS 证书，适合生产或需要加密/校验域名的场景；本地开发常用 HTTP 以减少证书折腾。

**故障：**若 **`kweaver-core-data-migrator` / pre-install Job 失败**：请确认数据层已就绪（现由 `kweaver-core install` 自动拉齐，或手动 `data-services install`）；必要时 `helm uninstall kweaver-core-data-migrator -n <namespace>` 后重试 `kweaver-core install`。若 `cluster up` 报错无法连接 `docker.sock`，请先**打开 Docker Desktop** 并等其启动完成，执行 `docker info` 确认后再试；`doctor` 会检查 Docker 引擎是否可用。**`doctor --fix` 不会启动 Docker 守护进程**（只能按需用 Homebrew 装 CLI）；若其它工具已齐，只需启动 Desktop 后再执行 `doctor`。

更多参数见 `bash ./dev/mac.sh -h` 及脚本头部注释。
