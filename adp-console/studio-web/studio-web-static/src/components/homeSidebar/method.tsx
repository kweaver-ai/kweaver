import React, { FC } from "react";

export const LogoImage: FC<{ icon: string; prefix: string }> = ({
    icon,
    prefix,
}) => {
    return (
        <img
            src={icon?.replace(
                /\/\/ip:port/,
                `${location.protocol}//${location.host}${prefix}`
            )}
            style={{
                width: "20px",
                height: "20px",
                marginBottom: "3px",
            }}
        />
    );
};

export const enum SiderBarRefBottomType {
    // 底部距离超过170px
    Large,
    // 底部距离小于170px
    Middle,
    // 底部距离为负
    Small,
}
