本目录用于存放 `init_infra.sh` 依赖的外部“配置/清单”文件（如 Kubernetes YAML、安装脚本），以减少运行时从 GitHub/第三方拉取带来的不稳定性。

- `kube-flannel.yml`: Flannel CNI 清单（与脚本内默认版本匹配）
- `local-path-storage.yaml`: local-path-provisioner 清单（与脚本内默认版本匹配）
- `get-helm-3`: Helm 官方安装脚本（可通过 `HELM_INSTALL_SCRIPT_PATH` 覆盖）

脚本会优先读取本目录中的文件；若文件不存在，则回退到在线下载（可用对应的 `*_URL` 环境变量覆盖下载地址）。

local-path 默认数据目录为 `/opt/local-path-provisioner`，可通过环境变量 `LOCALPV_BASE_PATH` 覆盖（仅影响新创建的 PV）。
