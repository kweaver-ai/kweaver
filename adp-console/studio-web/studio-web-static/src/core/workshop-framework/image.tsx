import * as React from "react";
import { throttle } from "lodash";
const { useRef, useState } = React;

/**
 * 使用canvas画图，并添加颜色
 */
function display(
    imgElement: any,
    canvasElement: any,
    redColor: any,
    grColor: any,
    blColor: any,
    size: any
) {
    // 获取设备像素比
    const devicePixelRatio = window.devicePixelRatio || 1;

    // 设置canvas的CSS尺寸
    canvasElement.style.width = size + "px";
    canvasElement.style.height = size + "px";

    // 设置canvas的实际像素尺寸（考虑设备像素比）
    canvasElement.width = size * devicePixelRatio;
    canvasElement.height = size * devicePixelRatio;

    const ctx1 = canvasElement.getContext("2d");

    // 缩放上下文以匹配设备像素比
    ctx1.scale(devicePixelRatio, devicePixelRatio);

    // 绘制图像
    ctx1.drawImage(imgElement, 0, 0, size, size);

    // 获取图像数据（注意：getImageData使用的是canvas实际像素尺寸，不受scale影响）
    const myImg = ctx1.getImageData(
        0,
        0,
        canvasElement.width,
        canvasElement.height
    );

    // 应用颜色变换
    let t;
    for (t = 0; t < myImg.data.length; t += 4) {
        myImg.data[t] = redColor;
        myImg.data[t + 1] = grColor;
        myImg.data[t + 2] = blColor;
    }

    // 将处理后的图像数据放回canvas
    ctx1.putImageData(myImg, 0, 0);
}

const throttleDisplay = throttle(display, 0, { trailing: false });

const Image: React.FunctionComponent<{ src: string }> = ({ src }) => {
    const imageRef: any = useRef(); // img元素
    const canvasRef: any = useRef(); // canvas元素
    const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false); // img是否已经加载完成
    const redrawRef = useRef<() => void>(() => {}); // 保存重绘函数，便于在全局事件中调用

    // 监听浏览器缩放/视口变化，自动重绘
    React.useEffect(() => {
        const handler = () => {
            if (typeof redrawRef.current === "function") {
                redrawRef.current();
            }
        };
        window.addEventListener("resize", handler);
        window.addEventListener("orientationchange", handler);
        if ((window as any).visualViewport?.addEventListener) {
            (window as any).visualViewport.addEventListener("resize", handler);
        }
        return () => {
            window.removeEventListener("resize", handler);
            window.removeEventListener("orientationchange", handler);
            if ((window as any).visualViewport?.removeEventListener) {
                (window as any).visualViewport.removeEventListener(
                    "resize",
                    handler
                );
            }
        };
    }, []);

    /**
     * 渲染canvas（注：为了给图片加上oem颜色，故使用canvas来处理图片）
     */
    const renderCanvas = () => {
        const target = canvasRef.current.parentElement.parentElement;
        // 定义重绘函数：从父父元素获取颜色和尺寸后进行重绘
        const redraw = () => {
            const [r, g, b] = target.style.color
                .replace("rgba", "")
                .replace("rgb", "")
                .replace("(", "")
                .replace(")", "")
                .split(",");
            const size = parseInt(target.style["font-size"].replace("px", ""));
            throttleDisplay(imageRef.current, canvasRef.current, r, g, b, size);
        };
        // 首次渲染
        redraw();
        // 暴露给全局事件回调
        redrawRef.current = redraw;
        setIsImageLoaded(true);

        // 创建观察者对象
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                // 监听style的变化（当icon变颜色的时候，target的style会发生变化），此时使用canvas重新制作图片
                if (mutation.attributeName === "style") {
                    redraw();
                }
            });
        });
        // 传入目标节点和观察选项
        observer.observe(target, { attributes: true });
    };

    return (
        <span>
            <img
                src={src}
                style={{ display: "none" }} // 图片不显示，仅仅是为了给canvas画图用的
                ref={imageRef}
                onLoad={renderCanvas}
            />
            <canvas
                ref={canvasRef}
                style={
                    isImageLoaded ? { display: "inherit" } : { display: "none" }
                }
            />
        </span>
    );
};
export default Image;
