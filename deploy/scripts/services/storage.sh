
install_localpv() {
    log_info "Installing local-path-provisioner (hostPath local PV)..."

    read_or_fetch "${LOCALPV_MANIFEST_PATH}" "${LOCALPV_MANIFEST_URL}" | \
        sed "s|image: rancher/local-path-provisioner:.*$|image: ${LOCALPV_PROVISIONER_IMAGE}|g" | \
        sed "s|image: busybox.*$|image: ${LOCALPV_HELPER_IMAGE}|g" | \
        sed "s|/opt/local-path-provisioner|${LOCALPV_BASE_PATH}|g" | \
        kubectl apply -f -

    kubectl wait --for=condition=Available deployment/local-path-provisioner -n local-path-storage --timeout=300s 2>/dev/null || true

    if [[ "${LOCALPV_SET_DEFAULT}" == "true" ]]; then
        kubectl patch storageclass local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}' 2>/dev/null || true
    fi

    log_info "local-path-provisioner installed"

    STORAGE_STORAGE_CLASS_NAME="local-path"
    if [[ "${AUTO_GENERATE_CONFIG}" == "true" ]]; then
        generate_config_yaml
    fi
}
