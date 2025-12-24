{{- define "this-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}



{{- define "this-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}



{{- define "this-app.labels" -}}
app: {{ include "this-app.name" . }}
{{- end -}}



{{- define "this-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (include "this-app.name" .) .Values.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}



{{- define "this-app.namespace" -}}
{{- default .Release.Namespace .Values.namespace -}}
{{- end -}}


{{- define "this-app.image" -}}
{{- printf "%s/%s:%s" .Values.image.registry .Values.image.repository .Values.image.tag -}}
{{- end -}}