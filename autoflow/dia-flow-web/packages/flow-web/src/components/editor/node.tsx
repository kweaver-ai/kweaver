import { FC } from "react";
import { Card } from "antd";
import { IStep } from "./expr";

interface Props {
    step: IStep;
    onChange(step: IStep): void;
}

export const Node: FC<Props> = ({ step, onChange }) => {
    return <Card></Card>;
};
