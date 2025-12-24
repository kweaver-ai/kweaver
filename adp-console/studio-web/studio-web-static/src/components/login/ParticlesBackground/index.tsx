import React from "react";
import Particles from "react-tsparticles";
import { loadLinksPreset } from "tsparticles-preset-links";

export const ParticlesBackground = () => {
    const particlesInit = async (main: any) => {
        await loadLinksPreset(main); // 加载 links 预设
    };

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
                preset: "links", // 直接使用预设
                // 自定义配置（可选）
                background: {
                    color: "#000000", // 背景颜色
                },
                particles: {
                    number: {max: 80},
                    color: "#ffffff" as any, // 粒子颜色
                    links: {
                        enable: true,
                        color: "#ffffff", // 连接线颜色
                    },
                },
            }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: -1, // 确保内容层在上方
            }}
        />
    );
};
