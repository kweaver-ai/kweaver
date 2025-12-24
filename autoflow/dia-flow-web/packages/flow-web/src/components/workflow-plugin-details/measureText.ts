const Context2d = document.createElement("canvas").getContext("2d") as CanvasRenderingContext2D;

export function measureText(text: string, font = `14px 'Noto Sans SC'`) {
    Context2d.font = font;
    return Context2d.measureText(text).width;
}
