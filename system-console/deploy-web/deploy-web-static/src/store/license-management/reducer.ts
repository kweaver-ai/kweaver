import { CHANGE_IS_OPERATED, CHANGE_LISENCE_TAB } from "./constants";

const defaultState = {
  isOperated: false,
  tabKey: "subscription",
};

export default (
  state = defaultState,
  action: { type: string; data: boolean | string }
) => {
  switch (action.type) {
    case CHANGE_IS_OPERATED:
      return {
        ...state,
        isOperated: action.data,
      };
    case CHANGE_LISENCE_TAB:
      return {
        ...state,
        tabKey: action.data,
      };
    default:
      return state;
  }
};
