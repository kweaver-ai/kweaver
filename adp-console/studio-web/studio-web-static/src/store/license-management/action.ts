import { CHANGE_IS_OPERATED, CHANGE_LISENCE_TAB } from "./constants";

const changeIsOperated = (data: boolean) => ({
  type: CHANGE_IS_OPERATED,
  data,
});

const changeTabKey = (data: string) => ({
  type: CHANGE_LISENCE_TAB,
  data,
});

export { changeIsOperated, changeTabKey };
