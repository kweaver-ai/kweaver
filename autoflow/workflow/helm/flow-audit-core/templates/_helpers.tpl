{{- define "rds.realDatabase" -}}
{{- printf "%s%s" .Values.depServices.rds.system_id .Values.depServices.rds.database -}}
{{- end -}} 

{{- define "redis.masterSlave.masterHost" -}}
  {{- if .Values.depServices.redis.connectInfo.masterHost -}}
    {{ .Values.depServices.redis.connectInfo.masterHost }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.masterSlave.masterPort" -}}
  {{- if .Values.depServices.redis.connectInfo.masterPort -}}
    {{ .Values.depServices.redis.connectInfo.masterPort | quote }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.masterSlave.slaveHost" -}}
  {{- if .Values.depServices.redis.connectInfo.slaveHost -}}
    {{ .Values.depServices.redis.connectInfo.slaveHost }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.masterSlave.slavePort" -}}
  {{- if .Values.depServices.redis.connectInfo.slavePort -}}
    {{ .Values.depServices.redis.connectInfo.slavePort | quote }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.masterSlave.username" -}}
  {{- if .Values.depServices.redis.connectInfo.username -}}
    {{ .Values.depServices.redis.connectInfo.username }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.masterSlave.password" -}}
  {{- if .Values.depServices.redis.connectInfo.password -}}
    {{ .Values.depServices.redis.connectInfo.password }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.standalone.host" -}}
  {{- if .Values.depServices.redis.connectInfo.host -}}
    {{ .Values.depServices.redis.connectInfo.host }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.standalone.port" -}}
  {{- if .Values.depServices.redis.connectInfo.port -}}
    {{ .Values.depServices.redis.connectInfo.port | quote }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.standalone.username" -}}
  {{- if .Values.depServices.redis.connectInfo.username -}}
    {{ .Values.depServices.redis.connectInfo.username }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.standalone.password" -}}
  {{- if .Values.depServices.redis.connectInfo.password -}}
    {{ .Values.depServices.redis.connectInfo.password }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.sentinel.sentinelHost" -}}
  {{- if .Values.depServices.redis.connectInfo.sentinelHost -}}
    {{ .Values.depServices.redis.connectInfo.sentinelHost }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.sentinel.sentinelPort" -}}
  {{- if .Values.depServices.redis.connectInfo.sentinelPort -}}
    {{ .Values.depServices.redis.connectInfo.sentinelPort | quote }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.sentinel.masterGroupName" -}}
  {{- if .Values.depServices.redis.connectInfo.masterGroupName -}}
    {{ .Values.depServices.redis.connectInfo.masterGroupName }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.sentinel.username" -}}
  {{- if .Values.depServices.redis.connectInfo.username -}}
    {{ .Values.depServices.redis.connectInfo.username | quote }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.sentinel.password" -}}
  {{- if .Values.depServices.redis.connectInfo.password -}}
    {{ .Values.depServices.redis.connectInfo.password }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.sentinel.sentinelUsername" -}}
  {{- if .Values.depServices.redis.connectInfo.sentinelUsername -}}
    {{ .Values.depServices.redis.connectInfo.sentinelUsername }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}

{{- define "redis.sentinel.sentinelPassword" -}}
  {{- if .Values.depServices.redis.connectInfo.sentinelPassword -}}
    {{ .Values.depServices.redis.connectInfo.sentinelPassword }}
  {{- else -}}
    ""
  {{- end -}}
{{- end -}}
