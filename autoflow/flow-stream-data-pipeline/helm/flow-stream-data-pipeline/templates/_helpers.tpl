{{/* vim: set filetype=mustache: */}}
{{/* Expand the name of the chart. */}}

{{- define "flow-stream-data-pipeline.name" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end -}}


{{/* Generate flow-stream-data-pipeline image */}}
{{- define "flow-stream-data-pipeline.image" -}}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.repository .Values.image.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.tag -}}
{{- end -}}
{{- end -}}