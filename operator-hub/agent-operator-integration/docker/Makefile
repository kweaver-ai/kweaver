demandId?=581755

commitMsg?="update_"`date +%Y-%m-%d_%H:%M:%S`

git_push:
	git add .
	git commit -m "[feature] 581755: $(commitMsg)"
	git push origin DATA-581755

# 注释掉go.mod中devops.aishu.cn相关的依赖，使用本地的
comment_out:
	sh ./.local/tools/comment_out.sh

# 取消注释go.mod中devops.aishu.cn相关的依赖
uncomment:
	sh ./.local/tools/uncomment.sh

cm:
	$(MAKE) uncomment
	source ./../CoreAppTools/util/git.sh||exit; \
	doCommit "[feature] ${demandId}: ${commitMsg}"

cm2:
	$(MAKE) cm
	$(MAKE) comment_out


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

rmMock:
	rm -rf port/driven/mock
	rm -rf port/driver/mock

add:
	gofmt -s -w .
	git add .

pull:
	git pull origin $(shell git rev-parse --abbrev-ref HEAD)

push:
	git pull origin $(shell git rev-parse --abbrev-ref HEAD)
	git push origin $(shell git rev-parse --abbrev-ref HEAD)