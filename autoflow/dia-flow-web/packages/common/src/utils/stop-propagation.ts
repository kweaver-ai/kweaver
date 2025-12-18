interface Propagable {
    stopPropagation(): void;
}

export function stopPropagation(e: Propagable) {
    e.stopPropagation();
}
