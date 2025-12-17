// Package parsers 实现API解析器
// @file api_parser.go
// @description: 实现API解析器
package parsers

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/go-playground/validator/v10"
)

var (
	oSync sync.Once
	o     interfaces.IOpenAPIParser
)

// openAPIParser OpenAPI解析器
// @description: 实现API解析器
type openAPIParser struct {
	Logger interfaces.Logger
}

// NewOpenAPIParser 新建OpenAPI解析器
func NewOpenAPIParser() interfaces.IOpenAPIParser {
	oSync.Do(func() {
		conf := config.NewConfigLoader()
		o = &openAPIParser{
			Logger: conf.GetLogger(),
		}
	})
	return o
}

func (op *openAPIParser) loadAndValidate(ctx context.Context, content []byte) (doc *openapi3.T, err error) {
	loader := openapi3.NewLoader()
	doc, err = loader.LoadFromData(content)
	if err != nil {
		err = parseOpenAPILoadError(ctx, err)
		return
	}
	// 790377 禁用示例验证
	validationExamplesOption := openapi3.DisableExamplesValidation()
	err = doc.Validate(loader.Context, validationExamplesOption)
	if err != nil {
		err = parseOpenAPIValidationError(ctx, err)
	}
	return
}

// GetPathItems 解析
func (op *openAPIParser) GetPathItems(ctx context.Context, data []byte) (items []*interfaces.PathItemContent, err error) {
	doc, err := op.loadAndValidate(ctx, data)
	if err != nil {
		return
	}
	items = []*interfaces.PathItemContent{}
	svcURL, err := getServerURL(ctx, doc.Servers)
	if err != nil {
		return
	}

	for path, pathItem := range doc.Paths.Map() {
		for method, operation := range pathItem.Operations() {
			// 收集所有schemas
			schemas := make(map[string]interface{})
			if operation.Summary == "" {
				err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOpenAPIInvalidSpecificationSummaryEmpty, "summary is empty",
					fmt.Sprintf("%s:%s", method, path))
				return
			}
			item := &interfaces.PathItemContent{
				Path:        path,
				Method:      method,
				Summary:     operation.Summary,
				Description: operation.Description,
				ServerURL:   svcURL,
				APISpec: interfaces.APISpec{
					Callbacks:    operation.Callbacks,
					Security:     operation.Security,
					Tags:         operation.Tags,
					ExternalDocs: operation.ExternalDocs,
					Parameters:   []*interfaces.Parameter{},
					Responses:    []*interfaces.Response{},
					RequestBody:  &interfaces.RequestBody{},
					Components: &interfaces.Components{
						Schemas: schemas,
					},
				},
			}
			// 处理参数
			item.APISpec.Parameters = getParameters(operation.Parameters, doc.Components, schemas)
			// 处理请求体
			if operation.RequestBody != nil {
				item.APISpec.RequestBody = getRequestBody(operation.RequestBody, doc.Components, schemas)
			}
			// 处理响应
			item.APISpec.Responses = getResponses(operation.Responses, doc.Components, schemas)
			err = validator.New().Struct(item)
			if err != nil {
				item.ErrMessage = err.Error()
			}
			items = append(items, item)
		}
	}
	return
}

// GetAllContent 解析所有内容
func (op *openAPIParser) GetAllContent(ctx context.Context, data []byte) (content *interfaces.OpenAPIContent, err error) {
	doc, err := op.loadAndValidate(ctx, data)
	if err != nil {
		return
	}
	svcURL, err := getServerURL(ctx, doc.Servers)
	if err != nil {
		return
	}
	content = &interfaces.OpenAPIContent{
		SererURL:  svcURL,
		Info:      doc.Info,
		PathItems: []*interfaces.PathItemContent{},
	}
	for path, pathItem := range doc.Paths.Map() {
		for method, operation := range pathItem.Operations() {
			// 收集所有schemas
			schemas := make(map[string]interface{})
			if operation.Summary == "" {
				err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOpenAPIInvalidSpecificationSummaryEmpty, "summary is empty",
					fmt.Sprintf("%s:%s", method, path))
				return
			}
			item := &interfaces.PathItemContent{
				Path:        path,
				Method:      method,
				Summary:     operation.Summary,
				Description: operation.Description,
				ServerURL:   svcURL,
				APISpec: interfaces.APISpec{
					Callbacks:    operation.Callbacks,
					Security:     operation.Security,
					Tags:         operation.Tags,
					ExternalDocs: operation.ExternalDocs,
					Parameters:   []*interfaces.Parameter{},
					Responses:    []*interfaces.Response{},
					RequestBody:  &interfaces.RequestBody{},
					Components: &interfaces.Components{
						Schemas: schemas,
					},
				},
			}
			// 处理参数
			item.APISpec.Parameters = getParameters(operation.Parameters, doc.Components, schemas)
			// 处理请求体
			if operation.RequestBody != nil {
				item.APISpec.RequestBody = getRequestBody(operation.RequestBody, doc.Components, schemas)
			}
			// 处理响应
			item.APISpec.Responses = getResponses(operation.Responses, doc.Components, schemas)
			err = validator.New().Struct(item)
			if err != nil {
				item.ErrMessage = err.Error()
			}
			content.PathItems = append(content.PathItems, item)
		}
	}
	return
}

func getServerURL(ctx context.Context, servers openapi3.Servers) (serverURL string, err error) {
	if len(servers) == 0 {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOpenAPIInvalidURLFormat, "no server URLs found")
		return
	}
	server := servers[0]
	err = server.Validate(ctx)
	if err != nil {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOpenAPIInvalidURLFormat, err.Error())
		return
	}
	url := server.URL
	// 处理路径变量
	if strings.Contains(url, "{") {
		// 获取所有变量名
		vars := make(map[string]string)
		for name, variable := range server.Variables {
			if variable.Default != "" {
				vars[name] = variable.Default
			} else {
				// 如果没有默认值，使用变量名作为占位符
				vars[name] = name
			}
		}

		// 替换URL中的变量
		for name, value := range vars {
			url = strings.ReplaceAll(url, "{"+name+"}", value)
		}
	}

	// 验证替换后的URL
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		err = fmt.Errorf("invalid server URL: must start with http:// or https:// in '%s'", url)
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOpenAPIInvalidURLFormat, err.Error())
		return
	}

	serverURL = url
	return
}

// GetParameters 解析OpenAPI参数
func getParameters(params openapi3.Parameters, components *openapi3.Components,
	schemas map[string]interface{}) []*interfaces.Parameter {
	result := make([]*interfaces.Parameter, 0, len(params))

	for _, param := range params {
		// 处理参数schema
		if param.Value.Schema != nil {
			if param.Value.Schema.Ref != "" || param.Value.Schema.Value != nil {
				// 收集schema引用
				collectSchemaRefs(components, param.Value.Schema, schemas, make(map[string]bool))
			}
		}
		// 创建参数
		result = append(result, &interfaces.Parameter{
			Name:        param.Value.Name,
			In:          param.Value.In,
			Description: param.Value.Description,
			Required:    param.Value.Required,
			Schema:      param.Value.Schema,
			Content:     param.Value.Content,
			Example:     param.Value.Example,
			Examples:    param.Value.Examples,
		})
	}
	return result
}

// GetResponses 解析OpenAPI响应
func getResponses(responses *openapi3.Responses, components *openapi3.Components, schemas map[string]interface{}) []*interfaces.Response {
	result := []*interfaces.Response{}
	for statusCode, resp := range responses.Map() {
		// 处理响应内容
		for _, content := range resp.Value.Content {
			if content.Schema != nil {
				if content.Schema.Ref != "" || content.Schema.Value != nil {
					// 收集schema引用
					collectSchemaRefs(components, content.Schema, schemas, make(map[string]bool))
				}
			}
		}
		// 创建响应
		result = append(result, &interfaces.Response{
			StatusCode:  statusCode,
			Description: *resp.Value.Description,
			Content:     resp.Value.Content,
		})
	}
	return result
}

// GetRequestBody 解析OpenAPI请求体
func getRequestBody(requestBody *openapi3.RequestBodyRef, components *openapi3.Components,
	schemas map[string]interface{}) *interfaces.RequestBody {
	// 处理请求体内容
	for _, content := range requestBody.Value.Content {
		if content.Schema != nil {
			if content.Schema.Ref != "" || content.Schema.Value != nil {
				// 收集schema引用
				collectSchemaRefs(components, content.Schema, schemas, make(map[string]bool))
			}
		}
	}
	return &interfaces.RequestBody{
		Description: requestBody.Value.Description,
		Content:     requestBody.Value.Content,
	}
}

// collectSchemaRefs 收集所有schema引用
func collectSchemaRefs(components *openapi3.Components, schemaRef *openapi3.SchemaRef, schemas map[string]interface{}, visited map[string]bool) {
	if schemaRef == nil {
		return
	}
	// 处理直接引用
	if schemaRef.Ref != "" {
		refKey := strings.TrimPrefix(schemaRef.Ref, "#/components/schemas/")
		if visited[refKey] {
			return
		}
		visited[refKey] = true
		defer delete(visited, refKey)
		// 添加到schemas集合
		if _, exists := schemas[refKey]; !exists {
			if origSchema, exists := components.Schemas[refKey]; exists {
				// 转换schema为map
				schemas[refKey] = schemaToMap(origSchema)
				// 递归处理引用
				traverseSchema(components, origSchema, schemas, visited)
			}
		}
	}
	if schemaRef.Value == nil {
		return
	}
	// 处理属性
	if schemaRef.Value.Properties != nil {
		for _, prop := range schemaRef.Value.Properties {
			collectSchemaRefs(components, prop, schemas, visited)
		}
	}
	// 处理数组
	if schemaRef.Value.Items != nil {
		collectSchemaRefs(components, schemaRef.Value.Items, schemas, visited)
	}
	// 处理组合类型
	for _, s := range schemaRef.Value.AllOf {
		collectSchemaRefs(components, s, schemas, visited)
	}
	for _, s := range schemaRef.Value.AnyOf {
		collectSchemaRefs(components, s, schemas, visited)
	}
	for _, s := range schemaRef.Value.OneOf {
		collectSchemaRefs(components, s, schemas, visited)
	}
}

// traverseSchema 递归遍历schema
func traverseSchema(components *openapi3.Components, schemaRef *openapi3.SchemaRef, schemas map[string]interface{}, visited map[string]bool) {
	if schemaRef == nil || schemaRef.Value == nil {
		return
	}
	// 处理属性
	if schemaRef.Value.Properties != nil {
		for _, prop := range schemaRef.Value.Properties {
			collectSchemaRefs(components, prop, schemas, visited)
		}
	}
	// 处理数组
	if schemaRef.Value.Items != nil {
		collectSchemaRefs(components, schemaRef.Value.Items, schemas, visited)
	}
	// 处理组合类型
	for _, s := range schemaRef.Value.AllOf {
		collectSchemaRefs(components, s, schemas, visited)
	}
	for _, s := range schemaRef.Value.AnyOf {
		collectSchemaRefs(components, s, schemas, visited)
	}
	for _, s := range schemaRef.Value.OneOf {
		collectSchemaRefs(components, s, schemas, visited)
	}
}

// schemaToMap 将schema转换为map
func schemaToMap(schemaRef *openapi3.SchemaRef) map[string]interface{} {
	result := make(map[string]interface{})

	// 处理引用
	if schemaRef.Ref != "" {
		result["$ref"] = schemaRef.Ref
		return result
	}

	// 处理基本类型
	if schemaRef.Value == nil {
		return result
	}

	if schemaRef.Value.Type != nil {
		result["type"] = schemaRef.Value.Type
	}

	if schemaRef.Value.Format != "" {
		result["format"] = schemaRef.Value.Format
	}

	if schemaRef.Value.Description != "" {
		result["description"] = schemaRef.Value.Description
	}
	// 添加默认值
	if schemaRef.Value.Default != nil {
		result["default"] = schemaRef.Value.Default
	}

	// 添加枚举值
	if len(schemaRef.Value.Enum) > 0 {
		result["enum"] = schemaRef.Value.Enum
	}

	// 添加required字段
	if len(schemaRef.Value.Required) > 0 {
		result["required"] = schemaRef.Value.Required
	}

	// 处理属性
	if schemaRef.Value.Properties != nil {
		props := make(map[string]interface{})
		for name, prop := range schemaRef.Value.Properties {
			props[name] = schemaToMap(prop)
		}
		result["properties"] = props
	}

	// 处理数组
	if schemaRef.Value.Items != nil {
		result["items"] = schemaToMap(schemaRef.Value.Items)
	}

	// 处理组合类型
	if len(schemaRef.Value.AllOf) > 0 {
		allOf := make([]interface{}, 0, len(schemaRef.Value.AllOf))
		for _, s := range schemaRef.Value.AllOf {
			allOf = append(allOf, schemaToMap(s))
		}
		result["allOf"] = allOf
	}

	if len(schemaRef.Value.AnyOf) > 0 {
		anyOf := make([]interface{}, 0, len(schemaRef.Value.AnyOf))
		for _, s := range schemaRef.Value.AnyOf {
			anyOf = append(anyOf, schemaToMap(s))
		}
		result["anyOf"] = anyOf
	}

	if len(schemaRef.Value.OneOf) > 0 {
		oneOf := make([]interface{}, 0, len(schemaRef.Value.OneOf))
		for _, s := range schemaRef.Value.OneOf {
			oneOf = append(oneOf, schemaToMap(s))
		}
		result["oneOf"] = oneOf
	}

	return result
}

// GetPathItemContent 获取指定路径项内容
func (op *openAPIParser) GetPathItemContent(ctx context.Context, data []byte, path, method string) (content *interfaces.PathItemContent, err error) {
	// 解析OpenAPI文档
	items, err := op.GetPathItems(ctx, data)
	if err != nil {
		return
	}
	// 获取指定路径项
	for _, item := range items {
		if item.Path != path || item.Method != method {
			continue
		}
		validator := validator.New()
		err = validator.Struct(item)
		if err != nil {
			return
		}
		content = item
		return
	}
	err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtCommonNoMatchedMethodPath,
		fmt.Sprintf("no matched method path found, path: %s, method: %s", path, method))
	return
}
