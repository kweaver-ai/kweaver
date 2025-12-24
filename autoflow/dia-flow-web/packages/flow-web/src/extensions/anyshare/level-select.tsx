import { DownOutlined } from "@ant-design/icons";
import { MicroAppContext, TranslateFn } from "@applet/common";
import { Button, Divider, Dropdown, InputNumber, Menu } from "antd";
import { FC, useContext, useState } from "react";

export const LevelSelect: FC<{
    t: TranslateFn;
    disabled?: boolean;
    value?: number;
    customLevelPlaceholder?: string;
    onChange?(number: number): void;
}> = ({ t, value, disabled, onChange, customLevelPlaceholder }) => {
    const { message } = useContext(MicroAppContext);
    const [open, setOpen] = useState(false);
    const [customLevel, setCustomLevel] = useState<number | null | undefined>(
        value && value > 5 ? value : undefined
    );

    return (
        <Dropdown
            trigger={["click"]}
            open={open}
            onOpenChange={setOpen}
            disabled={disabled}
            overlay={() => (
                <Menu
                    selectable
                    selectedKeys={[String(value)]}
                    style={{ paddingBottom: 12 }}
                    onSelect={(e) => {
                        if (onChange) {
                            onChange(Number(e.key));
                            setOpen(false);
                        }
                        setCustomLevel(undefined);
                    }}
                >
                    <Menu.Item key="-1">{t("all")}</Menu.Item>
                    {Array.from({ length: 5 }, (_, i) => {
                        const level = i + 1;
                        return (
                            <Menu.Item key={String(level)}>
                                {level === 1
                                    ? t("nLevel", { level })
                                    : t("nLevels", { level })}
                            </Menu.Item>
                        );
                    })}
                    <Divider style={{ margin: "4px 0" }} />
                    <div>
                        <div
                            style={{ padding: "0 12px" }}
                            onKeyDown={(e) => {
                                switch (e.key) {
                                    case "ArrowUp":
                                    case "ArrowDown":
                                        e.stopPropagation();
                                        break;
                                }
                            }}
                        >
                            {t("customLevel", {
                                custom: () => (
                                    <InputNumber
                                        placeholder={customLevelPlaceholder}
                                        min={1}
                                        precision={0}
                                        value={customLevel}
                                        onChange={setCustomLevel}
                                    />
                                ),
                            })}
                        </div>
                        <div
                            style={{
                                marginTop: 12,
                                padding: "0 12px",
                                display: "flex",
                                justifyContent: "flex-end",
                            }}
                        >
                            <Button
                                type="primary"
                                className="automate-oem-primary-btn"
                                size="small"
                                onClick={() => {
                                    if (customLevel === undefined) {
                                        message.info(t("invalidLevelMessage"));
                                    } else {
                                        if (onChange && customLevel) {
                                            onChange(customLevel);
                                            if (customLevel <= 5) {
                                                setCustomLevel(undefined);
                                            }
                                        }
                                        setOpen(false);
                                    }
                                }}
                            >
                                {t("ok")}
                            </Button>
                        </div>
                    </div>
                </Menu>
            )}
        >
            <Button>
                {!value || value < 0
                    ? t("all")
                    : value === 1
                    ? t("nLevel", { level: value })
                    : t("nLevels", { level: value })}
                <DownOutlined />
            </Button>
        </Dropdown>
    );
};
