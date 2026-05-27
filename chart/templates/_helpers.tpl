{{/*
Common name. Defaults to chart name. Truncated to 63 chars (k8s label limit).
*/}}
{{- define "nestjs.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fullname = release-name + chart-name. Used as resource name.
If release name already contains chart name, don't repeat.
*/}}
{{- define "nestjs.fullname" -}}
{{- if contains .Chart.Name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Common labels — attached to every resource.
*/}}
{{- define "nestjs.labels" -}}
app.kubernetes.io/name: {{ include "nestjs.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end -}}

{{/*
Selector labels — used in spec.selector. Must NOT change across upgrades
(selectors are immutable for Deployment).
*/}}
{{- define "nestjs.selectorLabels" -}}
app.kubernetes.io/name: {{ include "nestjs.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Postgres selector labels — separate app, separate selector.
*/}}
{{- define "postgres.selectorLabels" -}}
app.kubernetes.io/name: postgres
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Postgres common labels — like nestjs.labels but with app.kubernetes.io/name=postgres.
*/}}
{{- define "postgres.labels" -}}
app.kubernetes.io/name: postgres
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end -}}
