package util

import "testing"

func TestLeftTrimEllipsisSize(t *testing.T) {
	tests := []struct {
		name string
		str  string
		size int
		exp  string
	}{
		{"正常截断_size5", "123456789", 5, "12..."},
		{"正常截断_size10", "123456789", 10, "123456789"},
		{"字符串短于size_size15", "123456789", 15, "123456789"},
		{"字符串短于size_size20", "123456789", 20, "123456789"},
		{"边界情况_size4", "123456789", 4, "1..."},
		{"边界情况_size等于字符串长度", "123456789", 9, "123456789"},
		{"长字符串_size10", "1234567890123", 10, "1234567..."},
		{"空字符串_size4", "", 4, ""},
		{"空字符串_size10", "", 10, ""},
		{"单字符_size4", "a", 4, "a"},
		{"单字符_size10", "a", 10, "a"},
		{"三字符_size4", "abc", 4, "abc"},
		{"三字符_size6", "abc", 6, "abc"},
		{"四字符_size4", "abcd", 4, "abcd"},
		{"四字符_size5", "abcd", 5, "abcd"},
		{"五字符_size4", "abcde", 4, "a..."},
		{"包含中文字符", "abc中文def", 6, "abc..."},
		{"纯英文长字符串", "abcdefghijklmnop", 8, "abcde..."},
		{"中文字符串较短", "中文测试", 10, "中文测试"},
		{"中文字符串较长", "这是一个很长的中文字符串测试", 8, "这是一个很..."},
		{"特殊字符_size6", "!@#$%^&*()", 6, "!@#..."},
		{"特殊字符_size15", "!@#$%^&*()", 15, "!@#$%^&*()"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			act := LeftTrimEllipsisSize(tt.str, tt.size)
			if act != tt.exp {
				t.Errorf("LeftTrimEllipsisSize(%s, %d) = %s, want %s", tt.str, tt.size, act, tt.exp)
			}
		})
	}
}

func TestLeftTrimEllipsisSizePanic(t *testing.T) {
	tests := []struct {
		name string
		str  string
		size int
	}{
		{"size为0", "123456789", 0},
		{"size为1", "123456789", 1},
		{"size为2", "123456789", 2},
		{"size为3", "123456789", 3},
		{"size为负数", "123456789", -1},
		{"空字符串size为0", "", 0},
		{"空字符串size为负数", "", -5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			defer func() {
				if r := recover(); r == nil {
					t.Errorf("期望panic但没有发生，size=%d", tt.size)
				}
			}()
			LeftTrimEllipsisSize(tt.str, tt.size)
		})
	}
}
