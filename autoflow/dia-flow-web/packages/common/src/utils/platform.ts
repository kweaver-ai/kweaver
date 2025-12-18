
/**
 * 是否是富客户端
 */
export function isElectron(microWidgetProps: any): boolean {
    const { config: { systemInfo: { isInElectronTab, platform } } } = microWidgetProps;

    return platform === "electron" || isInElectronTab;
}

/**
 * 是否是web客户端
 */
export function isWeb(microWidgetProps: any): boolean {
    return !isElectron(microWidgetProps)
}

/**
 * 是否是mac富客户端
 */
export function isMacRich(microWidgetProps: any): boolean {
    return isElectron(microWidgetProps) && process?.platform === "darwin";
}

/**
 * 是否是linux富客户端
 */
export function isLinuxRich(microWidgetProps: any): boolean {
    return isElectron(microWidgetProps) && process?.platform === "linux";
}

/**
 * 是否是windows富客户端
 */
export function isWindowsRich(microWidgetProps: any): boolean {
    return isElectron(microWidgetProps) && process?.platform === "win32";
}
