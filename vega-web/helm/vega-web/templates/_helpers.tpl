{{/* vim: set filetype=mustache: */}}
{{/* Expand the name of the chart. */}}

{{- define "manage-web.name" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end -}}


{{/* Generate manage-web image */}}
{{- define "manage-web.image" -}}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.repository .Values.image.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.tag -}}
{{- end -}}
{{- end -}}