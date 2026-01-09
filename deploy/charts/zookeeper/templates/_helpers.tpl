{{/* vim: set filetype=mustache: */}}
{{/* Expand the name of the chart. */}}
{{- define "zookeeper.name" -}}
{{- if contains "zookeeper" .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name "zookeeper" | trunc 63 | trimSuffix "-" }}
{{- end -}}
{{- end -}}

{{/* Return the proper zookeeper image name */}}
{{- define "zookeeper.image" -}}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.zookeeper.repository .Values.image.zookeeper.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.zookeeper.repository .Values.image.zookeeper.tag -}}
{{- end -}}
{{- end -}}

{{/* Generate exporter image */}}
{{- define "zookeeper-exporter.image" }}
{{- if .Values.image.registry }}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.exporter.repository .Values.image.exporter.tag -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.exporter.tag -}}
{{- end -}}
{{- end -}}

{{/* Return the proper zookeeper servers name */}}
{{- define "zookeeper.servers" -}}
{{- $name := (include "zookeeper.name" .) }}
{{- range $i := until (int .Values.replicaCount) }}
{{- if $i }} {{ end }}server.{{ (add $i 1) }}={{ $name }}-{{ $i }}.{{ $name }}-headless.{{ $.Values.namespace }}.svc.cluster.local:2888:3888
{{- end -}}
{{- end -}}

{{/* Return the default zookeeper ssl secret name */}}
{{- define "zookeeper.defaultSSLSecretName" -}}
{{- printf "%s-%s" (include "zookeeper.name" .) "ssl" -}}
{{- end -}}