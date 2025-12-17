package toolbox

// func TestLoadInternalTools(t *testing.T) {
// 	// 加载./internal_tool 下的全部yaml、json文件
// 	files, err := filepath.Glob("./internal_tool/*.json")
// 	if err != nil {
// 		t.Errorf("failed to find internal tool files: %v", err)
// 	}
// 	toolBoxes := make([]*internalToolBox, 0)
// 	for _, file := range files {
// 		toolBox := &internalToolBox{}
// 		content, err := os.ReadFile(file)
// 		if err != nil {
// 			t.Errorf("failed to read internal tool file: %v", err)
// 		}
// 		err = jsoniter.Unmarshal(content, &toolBox)
// 		if err != nil {
// 			t.Errorf("failed to unmarshal internal tool file: %v", err)
// 		}
// 		toolBoxes = append(toolBoxes, toolBox)
// 	}
// 	for _, toolBox := range toolBoxes {
// 		fmt.Println(utils.ObjectToJSON(toolBox))
// 	}
// }
