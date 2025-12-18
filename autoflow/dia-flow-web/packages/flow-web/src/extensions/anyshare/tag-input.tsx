import { MicroAppContext, TranslateFn } from "@applet/common";
import { Select, Button } from "antd";
import { FC, useContext, useRef, useState } from "react";

export interface TagInputProps {
    t: TranslateFn;
    placeholder?: string;
    value?: string[];
    onChange?(value?: string[]): void;
}

export const TagInput: FC<TagInputProps> = ({
    t,
    placeholder,
    value,
    onChange,
    ...props
}) => {
    const [searchValue, setSearchValue] = useState("");
    const ref = useRef<any>(null);
    const { message } = useContext(MicroAppContext);

    return (
        <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ marginRight: 8, flexGrow: 1, width: 0 }}>
                <Select
                    mode="tags"
                    open={false}
                    searchValue={searchValue}
                    onSearch={(searchValue) => {
                        if (/[#\\/:*?\\"<>|]/.test(searchValue)) {
                            return;
                        }
                        setSearchValue(searchValue);
                    }}
                    value={value}
                    onChange={(value) => {
                        if (typeof onChange === "function") {
                            onChange(value.length ? value : undefined);
                            setSearchValue("");
                        }
                    }}
                    style={{ width: "100%" }}
                    placeholder={placeholder}
                    onInputKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const tag = searchValue.trim();

                            if (value?.includes(tag)) {
                                message.info(t("tagInput.existed"));
                            }
                        }
                    }}
                    ref={ref}
                    {...props}
                />
            </div>
            <Button
                onClick={() => {
                    ref.current?.focus();
                    const tag = searchValue.trim();

                    if (value?.includes(tag)) {
                        message.info(t("tagInput.existed"));
                        return;
                    }

                    if (
                        typeof onChange === "function" &&
                        tag &&
                        !value?.includes(tag)
                    ) {
                        onChange([...(value || []), tag]);
                        setSearchValue("");
                    }
                }}
            >
                {t("tagInput.add")}
            </Button>
        </div>
    );
};
