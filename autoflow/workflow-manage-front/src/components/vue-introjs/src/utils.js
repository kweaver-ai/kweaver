export function waitForDirectives() {
    return new Promise(resolve => {
        if (window.__introjsDiscovery.ready) {
            resolve();
        } else {
            window.__introjsDiscovery.$on('ready', () => {
                resolve();
            });
        }
    });
}
