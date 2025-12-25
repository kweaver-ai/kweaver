ARG DEVOPS_PAT

FROM acr.aishu.cn/ict/builder:golang-1.25.5n AS goenv
ARG DEVOPS_PAT
ENV DEVOPS_PAT=${DEVOPS_PAT}

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

##### builder stage
FROM goenv as builder
RUN --mount=type=bind,target=/app,readwrite \
    go build  -o /build-result/server ./cmd/server/ && \
    go build  -o /build-result/check ./cmd/check/ && \
    go build  -o /build-result/initdb ./cmd/initdb/


##### builder result
FROM acr.aishu.cn/public/ubuntu:22.04.20241010 as build-result
ENV TZ=Asia/Shanghai LANG=en_US.UTF-8
COPY --from=builder /build-result /app
WORKDIR /app
CMD ["./server"]

##### tester stage
FROM goenv as tester
RUN --mount=type=bind,target=/app,readwrite \
    go tool golangci-lint run --output.junit-xml.path /ut-result/lint-results.xml && \
    go tool gotestsum --packages="./..."  --junitfile ut-result/junit-results.xml  -- -gcflags="all=-N -l" --coverprofile=/ut-result/coverage.txt && \
    go tool gocov convert /ut-result/coverage.txt > /ut-result/coverage.json && \
    go tool gocov-xml < /ut-result/coverage.json > /ut-result/coverage.xml

##### tester result
FROM scratch as test-result
COPY --from=tester /ut-result .

FROM build-result