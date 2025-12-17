.DEFAULT_GOAL := all

ciLint:
	golangci-lint run --out-format=colored-line-number ./...
	@echo "ciLint done"

ciLintFix:
	@golangci-lint run --out-format=colored-line-number ./... --fix
	@echo "ciLintFix done"

wsl:
	@wsl --fix ./... >/dev/null 2>&1 ||true
	@echo "wsl done"

fmt:
	@gofumpt -w .
	@goimports -w ./**/*.go
	@echo "fmt done"

all:
	$(MAKE) wsl
	$(MAKE) fmt
	#$(MAKE) ciLintFix

ut:
	rm -rf coverage_report
	mkdir coverage_report
	go generate ./...
	go test -v -coverprofile=coverage_report/cover.out  ./... 2>&1 | go-junit-report > coverage_report/lint_report.xml
	gocov convert coverage_report/cover.out | gocov-xml > coverage_report/coverage.xml
	gocov convert coverage_report/cover.out | gocov-html > coverage_report/coverage.html

goGenerate:
	go generate ./...

goTest:
	go test -v ./...

add:
	goimports -w ./**/*.go
	git add .

pull:
	git pull origin $(shell git rev-parse --abbrev-ref HEAD)

push:
	git pull origin $(shell git rev-parse --abbrev-ref HEAD)
	git push origin $(shell git rev-parse --abbrev-ref HEAD)


localRun:
	export AD_STRATEGY_CENTER_AR_TRACE_DEBUG=true;\
	export AD_STRATEGY_CENTER_LOCAL_DEV=true;\
	export AGENT_FACTORY_AR_TRACE_DEBUG=true;\
	export AGENT_FACTORY_CONFIG_PATH=./.local/conf/;\
	export AGENT_FACTORY_LOCAL_DEV=true;\
	export AGENT_FACTORY_LOCAL_DEV_AARON=true;\
	export AGENT_FACTORY_SQL_PRINT=false;\
	export STRATEGY_CENTER_CONFIG_PATH=./.local/conf/;\
	export STRATEGY_CENTER_SQL_PRINT=false;\
	export SERVICE_NAME=agent-factory;\
	go build -o agent-factory ./main.go;\
	./agent-factory

killLocal:
	lsof -i :13020 | awk 'NR!=1 {print $2}' | xargs kill -9

reRunLocal:
	$(MAKE) killLocal
	$(MAKE) localRun
