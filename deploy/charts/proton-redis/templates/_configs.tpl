{{/* vim: set filetype=mustache: */}}

{{- define "config-users.acl" }}
    user monitor-user on #8d580eff577d0a63ab1fa7129f9802c3f995ae2ec1a871ff9f639087c993be8a -@all +ping +@connection +memory -readonly +strlen +config|get +xinfo +pfcount -quit +zcard +type +xlen -readwrite -command +client -wait +scard +llen +hlen +get +eval +slowlog +cluster|info +cluster|slots +cluster|nodes -hello -echo +info +latency +scan -reset -auth -asking
{{- end }}

{{- define "config-sentinel-users.acl" }}
    user monitor-user on #8d580eff577d0a63ab1fa7129f9802c3f995ae2ec1a871ff9f639087c993be8a -@all +ping +@connection -command +client -hello +info -auth +sentinel|masters +sentinel|replicas +sentinel|slaves +sentinel|sentinels +sentinel|ckquorum +sentinel|failover +sentinel|get-master-addr-by-name
{{- end }}

{{- define "config-redis.conf" }}
    dir "/data"
    loglevel {{ .Values.redis.loglevel }}
    logfile "/data/redis.log"
    port {{ .Values.service.redis.port }}
{{- if lt 1 (int .Values.replicaCount) }}
    min-replicas-to-write 1
{{- end }}
    min-replicas-max-lag 5
    maxmemory {{ .Values.redis.maxmemory }}
    maxmemory-policy {{ .Values.redis.maxmemoryPolicy }}
    save 900 1
    repl-diskless-sync yes
    appendonly yes
    io-threads 8
    io-threads-do-reads yes
    aclfile "/data/conf/users.acl"
    masteruser "replica-user"
    masterauth "secretpwd"
    {{- range $key, $val := .Values.redis.renameCommand }}
    rename-command "{{ $key }}" "{{ $val }}"
    {{- end}}
    ignore-warnings ARM64-COW-BUG
{{- if .Values.enableSSL }}
    tls-port 6380
    tls-cert-file /data/tls/server-cert.pem
    tls-key-file /data/tls/server-key.pem
    tls-ca-cert-file /data/tls/ca.pem
{{- end }}
{{- end }}

{{- define "config-sentinel.conf" }}
    dir "/data"
    loglevel {{ .Values.redis.loglevel }}
    logfile "/data/sentinel.log"
    port {{ .Values.service.sentinel.port }}
    maxclients {{ .Values.redis.maxclients }}
    aclfile "/data/conf/sentinel-users.acl"
    sentinel resolve-hostnames yes
    sentinel announce-hostnames yes
    sentinel sentinel-user "sentinel-user"
    sentinel sentinel-pass "secretpwd"
    sentinel auth-user "{{ .Values.redis.masterGroupName }}" "sentinel-user"
    sentinel auth-pass "{{ .Values.redis.masterGroupName }}" "secretpwd"
    sentinel down-after-milliseconds "{{ .Values.redis.masterGroupName }}" 10000
    sentinel parallel-syncs "{{ .Values.redis.masterGroupName }}" 5
    {{- range $key, $val := .Values.redis.renameCommand }}
    sentinel rename-command "{{ $.Values.redis.masterGroupName }}" "{{ $key }}" "{{ $val }}"
    {{- end}}
{{- end }}