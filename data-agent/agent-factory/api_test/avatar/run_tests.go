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
		"list",
		"detail",
		"error_handling",
	}

	// 获取当前目录
	currentDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("获取当前目录失败: %v", err)
	}

	fmt.Println("🎯 开始执行头像API测试套件")
	fmt.Println(strings.Repeat("=", 60))
	fmt.Printf("📍 测试目录: %s\n", currentDir)
	fmt.Printf("🕐 开始时间: %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Println()

	totalTests := 0
	passedTests := 0
	failedTests := 0
	var allReports []TestSummary

	// 首先运行完整测试套件
	fmt.Println("🚀 执行完整测试套件...")
	fmt.Println(strings.Repeat("-", 40))

	completeConfigPath := filepath.Join(currentDir, "complete_test_suite.yaml")
	if _, err := os.Stat(completeConfigPath); err == nil {
		summary := runTestConfig(completeConfigPath, "完整测试套件")
		allReports = append(allReports, summary)
		totalTests += summary.Total
		passedTests += summary.Passed
		failedTests += summary.Failed
	} else {
		fmt.Printf("⚠️  完整测试套件配置文件不存在: %s\n", completeConfigPath)
	}

	// 然后遍历每个测试目录
	for _, testDir := range testDirs {
		configPath := filepath.Join(currentDir, testDir, "test_config.yaml")

		// 检查配置文件是否存在
		if _, err := os.Stat(configPath); os.IsNotExist(err) {
			fmt.Printf("⚠️  跳过 %s: 配置文件不存在\n", testDir)
			continue
		}

		fmt.Printf("\n📋 执行 %s 模块测试...\n", testDir)
		fmt.Println(strings.Repeat("-", 30))

		summary := runTestConfig(configPath, testDir)
		allReports = append(allReports, summary)
		totalTests += summary.Total
		passedTests += summary.Passed
		failedTests += summary.Failed
	}

	// 生成综合报告
	generateSummaryReport(currentDir, allReports)

	// 打印总结
	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Printf("🎯 测试总结报告\n")
	fmt.Println(strings.Repeat("-", 60))
	fmt.Printf("📊 总计测试: %d 个\n", totalTests)
	fmt.Printf("✅ 通过测试: %d 个\n", passedTests)
	fmt.Printf("❌ 失败测试: %d 个\n", failedTests)

	if totalTests > 0 {
		successRate := float64(passedTests) / float64(totalTests) * 100
		fmt.Printf("📈 成功率: %.1f%%\n", successRate)
	}

	fmt.Printf("🕐 结束时间: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	// 打印各模块详细结果
	fmt.Println("\n📋 各模块测试结果:")
	fmt.Println(strings.Repeat("-", 60))
	for _, report := range allReports {
		status := "✅"
		if report.Failed > 0 {
			status = "❌"
		}
		fmt.Printf("%s %-20s | 总计: %2d | 通过: %2d | 失败: %2d\n",
			status, report.Name, report.Total, report.Passed, report.Failed)
	}

	if failedTests > 0 {
		fmt.Printf("\n❌ 有 %d 个测试失败，请检查详细报告\n", failedTests)
		fmt.Println("📁 详细报告位置: ./reports/ 目录")
		os.Exit(1)
	} else {
		fmt.Println("\n🎉 所有测试都通过了！头像API功能正常！")
		fmt.Println("🔗 可以通过以下方式访问头像:")
		fmt.Println("   - 头像列表: GET /api/agent-factory/v3/agent/avatar/built-in")
		fmt.Println("   - 单个头像: GET /api/agent-factory/v3/agent/avatar/built-in/{1-10}")
	}
}

// TestSummary 测试摘要结构
type TestSummary struct {
	Name       string
	Total      int
	Passed     int
	Failed     int
	ReportPath string
}

// runTestConfig 运行指定配置文件的测试
func runTestConfig(configPath, testName string) TestSummary {
	summary := TestSummary{Name: testName}

	// 创建测试器
	tester := apitest.New()

	// 加载配置
	config, err := tester.LoadConfigFromFile(configPath)
	if err != nil {
		fmt.Printf("❌ 加载配置文件失败: %v\n", err)
		return summary
	}

	// 执行测试
	report, err := tester.RunTests(config)
	if err != nil {
		fmt.Printf("❌ 执行测试失败: %v\n", err)
		return summary
	}

	// 统计结果
	summary.Total = len(report.Results)
	for _, result := range report.Results {
		if result.Success {
			summary.Passed++
		} else {
			summary.Failed++
		}
	}

	// 生成HTML报告
	reportDir := filepath.Join(filepath.Dir(configPath), "..", "reports")
	os.MkdirAll(reportDir, 0o755)

	reportPath := filepath.Join(reportDir, fmt.Sprintf("report_%s_%s.html",
		testName, time.Now().Format("20060102_150405")))
	err = tester.GenerateReport(report, "html", reportPath)
	if err != nil {
		fmt.Printf("⚠️  生成HTML报告失败: %v\n", err)
	} else {
		summary.ReportPath = reportPath
		fmt.Printf("📊 HTML报告已生成: %s\n", reportPath)
	}

	// 打印简要结果
	fmt.Printf("✅ 通过: %d, ❌ 失败: %d", summary.Passed, summary.Failed)

	// 如果有失败的测试，打印详细信息
	failedResults := getFailedResults(report.Results)
	if len(failedResults) > 0 {
		fmt.Printf("\n❌ 失败的测试:\n")
		for i, result := range failedResults {
			if i < 3 { // 只显示前3个失败的测试
				fmt.Printf("  %d. %s: %s\n", i+1, result.TestName, result.Error)
			}
		}
		if len(failedResults) > 3 {
			fmt.Printf("  ... 还有 %d 个失败测试，详见报告\n", len(failedResults)-3)
		}
	}

	fmt.Println()
	return summary
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

// generateSummaryReport 生成综合测试报告
func generateSummaryReport(baseDir string, reports []TestSummary) {
	reportDir := filepath.Join(baseDir, "reports")
	os.MkdirAll(reportDir, 0o755)

	summaryPath := filepath.Join(reportDir, fmt.Sprintf("summary_%s.txt",
		time.Now().Format("20060102_150405")))

	file, err := os.Create(summaryPath)
	if err != nil {
		fmt.Printf("⚠️  创建综合报告失败: %v\n", err)
		return
	}
	defer file.Close()

	file.WriteString("头像API测试综合报告\n")
	file.WriteString(strings.Repeat("=", 50) + "\n")
	file.WriteString(fmt.Sprintf("生成时间: %s\n\n", time.Now().Format("2006-01-02 15:04:05")))

	totalTests := 0
	totalPassed := 0
	totalFailed := 0

	for _, report := range reports {
		file.WriteString(fmt.Sprintf("模块: %s\n", report.Name))
		file.WriteString(fmt.Sprintf("  总计: %d\n", report.Total))
		file.WriteString(fmt.Sprintf("  通过: %d\n", report.Passed))
		file.WriteString(fmt.Sprintf("  失败: %d\n", report.Failed))
		if report.ReportPath != "" {
			file.WriteString(fmt.Sprintf("  报告: %s\n", report.ReportPath))
		}
		file.WriteString("\n")

		totalTests += report.Total
		totalPassed += report.Passed
		totalFailed += report.Failed
	}

	file.WriteString(strings.Repeat("-", 50) + "\n")
	file.WriteString(fmt.Sprintf("总计: %d\n", totalTests))
	file.WriteString(fmt.Sprintf("通过: %d\n", totalPassed))
	file.WriteString(fmt.Sprintf("失败: %d\n", totalFailed))

	if totalTests > 0 {
		successRate := float64(totalPassed) / float64(totalTests) * 100
		file.WriteString(fmt.Sprintf("成功率: %.1f%%\n", successRate))
	}

	fmt.Printf("📄 综合报告已生成: %s\n", summaryPath)
}
