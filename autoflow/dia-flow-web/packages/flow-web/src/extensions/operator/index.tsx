import {Extension} from "../../components/extension";
import { OperatorFormTriggerAction } from "../internal/operator-form-trigger";

export default {
    name: "operator",
    triggers: [
        {
            name: "开始",
            description: "TAFormDescription",
            actions: [OperatorFormTriggerAction],
        },
    ],
} as Extension;
