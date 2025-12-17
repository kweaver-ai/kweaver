package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/tool/apitesttool/apitest"
)

func main() {
	// 测试目录列表
	testDirs := []string{
		"agent_tpl_list",
		"agent_list",
	}

	// 获取当前目录
	currentDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("获取当前目录失败: %v", err)
	}

	fmt.Println("🚀 开始执行个人空间API测试套件")
	fmt.Println(strings.Repeat("=", 50))

	totalTests := 0
	passedTests := 0
	failedTests := 0

	// 遍历每个测试目录
	for _, testDir := range testDirs {
		configPath := filepath.Join(currentDir, testDir, "test_config.yaml")

		// 检查配置文件是否存在
		if _, err := os.Stat(configPath); os.IsNotExist(err) {
			fmt.Printf("⚠️  跳过 %s: 配置文件不存在\n", testDir)
			continue
		}

		fmt.Printf("\n📋 执行 %s 测试...\n", testDir)
		fmt.Println(strings.Repeat("-", 30))

		// 创建测试器
		tester := apitest.New()

		// 加载配置
		config, err := tester.LoadConfigFromFile(configPath)
		if err != nil {
			fmt.Printf("❌ 加载配置文件失败: %v\n", err)
			continue
		}

		// 执行测试
		report, err := tester.RunTests(config)
		if err != nil {
			fmt.Printf("❌ 执行测试失败: %v\n", err)
			continue
		}

		// 统计结果
		totalTests += len(report.Results)

		for _, result := range report.Results {
			if result.Success {
				passedTests++
			} else {
				failedTests++
			}
		}

		// 生成HTML报告
		reportPath := filepath.Join(currentDir, testDir, fmt.Sprintf("report_%s.html", time.Now().Format("20060102_150405")))

		err = tester.GenerateReport(report, "html", reportPath)
		if err != nil {
			fmt.Printf("⚠️  生成HTML报告失败: %v\n", err)
		} else {
			fmt.Printf("📊 HTML报告已生成: %s\n", reportPath)
		}

		// 打印简要结果
		fmt.Printf("✅ 通过: %d, ❌ 失败: %d\n",
			len(report.Results)-len(getFailedResults(report.Results)),
			len(getFailedResults(report.Results)))

		// 如果有失败的测试，打印详细信息
		failedResults := getFailedResults(report.Results)
		if len(failedResults) > 0 {
			fmt.Println("\n❌ 失败的测试:")

			for _, result := range failedResults {
				fmt.Printf("  - %s: %s\n", result.TestName, result.Error)
			}
		}
	}

	// 打印总结
	fmt.Println("\n" + strings.Repeat("=", 50))
	fmt.Printf("🎯 测试总结: 总计 %d 个测试, 通过 %d 个, 失败 %d 个\n",
		totalTests, passedTests, failedTests)

	if failedTests > 0 {
		fmt.Printf("❌ 有 %d 个测试失败，请检查详细报告\n", failedTests)
		os.Exit(1)
	} else {
		fmt.Println("🎉 所有测试都通过了！")
	}
}

// getFailedResults 获取失败的测试结果
func getFailedResults(results []apitest.TestResult) []apitest.TestResult {
	var failed []apitest.TestResult

	for _, result := range results {
		if !result.Success {
			failed = append(failed, result)
		}
	}

	return failed
}
