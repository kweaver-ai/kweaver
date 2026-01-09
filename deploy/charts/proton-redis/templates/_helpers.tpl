{{/* Generate redis names */}}
{{- define "redis.name" }}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Generate redis image */}}
{{- define "redis.image" }}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.redis.repository .Values.image.redis.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.redis.repository .Values.image.redis.tag -}}
{{- end -}}
{{- end -}}

{{/* Generate exporter image */}}
{{- define "exporter.image" }}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.exporter.repository .Values.image.exporter.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.exporter.repository .Values.image.exporter.tag -}}
{{- end -}}
{{- end -}}
