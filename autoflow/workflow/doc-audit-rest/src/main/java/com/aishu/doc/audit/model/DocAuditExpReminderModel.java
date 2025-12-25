package com.aishu.doc.audit.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DocAuditExpReminderModel {
    private String procDefID;
    private String expReminderSwitch;
    private String expReminderInternal;
    private String expReminderFreq;
}
