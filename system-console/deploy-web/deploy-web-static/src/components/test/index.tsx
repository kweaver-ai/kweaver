import React from "react";
import type { RootState } from "../../store";
import { useDispatch } from "react-redux";
import { setLanguage, getLanguage } from "../../store/language";

export const Test = React.memo(() => {
    const dispatch = useDispatch();

    return (
        <div>
            <div>
                <button
                    aria-label="Increment value"
                    onClick={() => dispatch(getLanguage())}
                >
                    Increment
                </button>
                <button
                    aria-label="Decrement value"
                    onClick={() => dispatch(setLanguage("zh-tw"))}
                >
                    Decrement
                </button>
            </div>
        </div>
    );
});
