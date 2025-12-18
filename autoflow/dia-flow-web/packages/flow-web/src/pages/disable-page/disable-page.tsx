import { useContext, useEffect } from "react";
import { DisableTip } from "../../components/disable-tip";
import { API, MicroAppContext } from "@applet/common";
import { useNavigate } from "react-router";

export const DisablePage = () => {
    const { prefixUrl } = useContext(MicroAppContext);
    const navigate = useNavigate();

    useEffect(() => {
        async function getServiceSwitch() {
            try {
                const { data } = await API.axios.get(
                    `${prefixUrl}/api/automation/v1/switch`
                );
                if (data.enable === true) {
                    navigate("/");
                }
            } catch (error) {
                console.error(error);
            }
        }
        getServiceSwitch();
    }, []);

    return <DisableTip />;
};
