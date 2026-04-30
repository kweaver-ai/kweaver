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

与**文档开头的英文小节**结构与内容对应；中英为同一流程的两套叙述。

**读者：**可与文首英文 **Audience** 相同：**macOS 开发者**作快速验证；**生产环境与主文档以 Linux 为准** —— [`deploy/README.zh.md`](../README.zh.md)、[`help/zh/install.md`](../../help/zh/install.md)。

本机 **kind** 起 Kubernetes，与 Linux `deploy.sh` 使用同一套 Helm Chart；宿主机不跑 **`preflight` / k3s / kubeadm**。

### 克隆仓库（先做好）

脚本与清单在仓库目录内；**`mac.sh` 不能脱离仓库单独使用**。请先 **[clone kweaver-ai/kweaver-core](https://github.com/kweaver-ai/kweaver-core)**，并切换到实际部署所用分支（如 `feature/deploy/k3s-module`），然后 **`cd` 进入 `deploy/`**：

```bash
git clone https://github.com/kweaver-ai/kweaver-core.git
cd kweaver-core/deploy   # 在此目录执行 bash ./dev/mac.sh ...（与 deploy.sh 同层）
```

从产品包解压时，路径中须有 **`deploy/`** 目录，布局与上文一致即可。

### 架构（Apple Silicon / arm64）

**Apple Silicon** 上 kind 节点默认为 **linux/arm64**。镜像来自 [`dev/conf/mac-config.yaml`](conf/mac-config.yaml) 的 **`image.registry`**（由 [`mac-config.yaml.example`](conf/mac-config.yaml.example) 复制）；须 **arm64 可用**（多架构 manifest 或 arm64 标签）。仅 **amd64** 的镜像易导致 *exec format error*。Intel Mac 上节点多为 **amd64**（除非另行指定平台）。

### 访问地址（HTTP 与自动 host）

- **HTTP 与 HTTPS：**HTTPS 加密并校验服务端；HTTP 不加密，开发环境常见；浏览器对 HTTP 的「不安全」提示属预期。
- **自动 IP：**`mac-config.yaml` 常用 **`accessAddress.scheme: http`**，且可**省略 `host`**（见示例）。**`kweaver-core install`** 会探测本机局域网 IP 并写入 values。若仅本机访问，可设 **`accessAddress.host: localhost`**。

### 操作流程

在 **`deploy/`** 下执行；用 **bash** 调用（如 `bash ./dev/mac.sh ...`）。**`kweaver-core` / `core`** 封装**默认带 `--minimum`**；全量依赖加 **`--full`**。

| 步骤 | 命令 | 是否必需？ |
|------|------|------------|
| 1 | `bash ./dev/mac.sh doctor` | 建议 |
| 2 | `bash ./dev/mac.sh doctor --fix`（或 `-y doctor --fix`） | 缺工具时 |
| 3 | `bash ./dev/mac.sh cluster up` | **安装前必须** |
| 4 | `bash ./dev/mac.sh data-services install` | **可选** — 仅单独装/刷新数据层；**`kweaver-core install` 会先跑同一套捆绑安装**（`KWEAVER_SKIP_DATA_SERVICES_BUNDLE=true` 可跳过） |
| 5 | `bash ./dev/mac.sh kweaver-core download` | **可选**（本地 chart 缓存；默认 **minimum** profile） |
| 6 | `bash ./dev/mac.sh kweaver-core install` | **必须** — 部署 Core（**默认 `--minimum`**）；默认**先装捆绑 data-services** |
| 7 | `bash ./dev/mac.sh onboard` | **可选**（需 `kweaver` CLI；`-y` 少交互） |

其它与 Linux **`deploy.sh`** 相同（须集群就绪、[`CONFIG_YAML_PATH`](conf/mac-config.yaml) 等与安装一致）：`bash ./dev/mac.sh isf install|download|uninstall|status`，`bash ./dev/mac.sh etrino …`（Vega；**`vega`** 为 **`etrino`** 别名）。ISF 对 DB/配置要求常更高。**未接入 `mac.sh`：**`kweaver-dip`。

**最短路径：**`cluster up` → `kweaver-core install`（**`--minimum` + 先装数据层**）。若 **`KWEAVER_SKIP_DATA_SERVICES_BUNDLE=true`**，须自备 DB/Kafka 等可达实例，或先执行 **`data-services install`**。

**卸载：**可先 **`bash ./dev/mac.sh data-services uninstall`**（卸数据层 Helm，保留 kind），再 **`bash ./dev/mac.sh cluster down`**。

**配置：**[`mac-config.yaml.example`](conf/mac-config.yaml.example) → **`mac-config.yaml`**；**已被 .gitignore**，避免口令入库；按需调整 **`accessAddress`**、**`image.registry`**。

另见：[`mac.sh`](mac.sh) 顶部注释、`bash ./dev/mac.sh -h`。

### 故障排除

- **`cluster up` 报 Docker API / `docker.sock`：**多为 **CLI 已装但引擎未起**。请先启动 **Docker Desktop**，`docker info` 通过后重试。**`doctor --fix`** 不会拉起守护进程。
- **`kweaver-core-data-migrator` / Job `BackoffLimitExceeded`：**确认数据层就绪（一般由 **`kweaver-core install` 自动安装**；否则 **`data-services install`**）。确认 **`depServices.rds`** 指向集群内 MariaDB；必要时 `helm uninstall kweaver-core-data-migrator -n <namespace>` 后再装 Core。