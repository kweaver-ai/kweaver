package com.aishu.wf.core.engine.core.model.warp;

import com.fasterxml.jackson.annotation.JsonProperty;

public abstract class ExpireReminderWarp {
    @JsonProperty("expReminderSwitch")
    private Boolean reminder_switch;

    @JsonProperty("expReminderInternal")
    private String internal;

    @JsonProperty("expReminderFreq")
    private String frequency;
}