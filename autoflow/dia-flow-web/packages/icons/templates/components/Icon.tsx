import AntdIcon from "@ant-design/icons/es/components/AntdIcon";
import { getTwoToneColor, setTwoToneColor, TwoToneColor } from "@ant-design/icons/es/components/twoTonePrimaryColor";
import { IconBaseProps } from "@ant-design/icons/es/components/Icon";
import { IconDefinition } from "../types";

export interface IconProps extends IconBaseProps {
    twoToneColor?: TwoToneColor;
}

export interface IconComponentProps extends IconProps {
    icon: IconDefinition;
}

interface IconBaseComponent<Props>
    extends React.ForwardRefExoticComponent<Props & React.RefAttributes<HTMLSpanElement>> {
    getTwoToneColor: typeof getTwoToneColor;
    setTwoToneColor: typeof setTwoToneColor;
}

export default AntdIcon as IconBaseComponent<IconComponentProps>;
