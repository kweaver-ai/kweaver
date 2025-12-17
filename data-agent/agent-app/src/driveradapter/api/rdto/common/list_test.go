package common

import "testing"

func TestListCommon_SetEntries(t *testing.T) {
	listCommon := NewListCommon()

	// 1. 字符串切片
	listCommon.SetEntries([]string{"a", "b", "c"})

	if len(listCommon.Entries) != 3 {
		t.Errorf("expected 3 entries, got %d", len(listCommon.Entries))
	}

	// 2. 整数切片
	listCommon.SetEntries([]int{1, 2, 3})

	if len(listCommon.Entries) != 3 {
		t.Errorf("expected 3 entries, got %d", len(listCommon.Entries))
	}

	// 3. 结构体切片
	listCommon.SetEntries([]struct {
		Name string
		Age  int
	}{
		{Name: "Alice", Age: 30},
		{Name: "Bob", Age: 25},
	})

	if len(listCommon.Entries) != 2 {
		t.Errorf("expected 2 entries, got %d", len(listCommon.Entries))
	}

	// 4. map切片
	listCommon.SetEntries([]map[string]interface{}{
		{"Name": "Alice", "Age": 30},
		{"Name": "Bob", "Age": 25},
	})

	if len(listCommon.Entries) != 2 {
		t.Errorf("expected 2 entries, got %d", len(listCommon.Entries))
	}

	// 5. 混合切片
	listCommon.SetEntries([]interface{}{
		"a",
		1,
		struct {
			Name string
			Age  int
		}{Name: "Alice", Age: 30},
		map[string]interface{}{"Name": "Bob", "Age": 25},
	})

	if len(listCommon.Entries) != 4 {
		t.Errorf("expected 4 entries, got %d", len(listCommon.Entries))
	}

	// 6. nil
	listCommon.SetEntries(nil)

	if len(listCommon.Entries) != 0 {
		t.Errorf("expected 0 entries, got %d", len(listCommon.Entries))
	}

	// 7. 不是切片 - 应该会 panic
	func() {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("传入非切片类型应该会 panic，但没有")
			} else if r != "entries must be a slice" {
				t.Errorf("期望的 panic 消息是 'entries must be a slice'，但得到的是 '%v'", r)
			}
		}()

		listCommon.SetEntries("a")
	}()
}
