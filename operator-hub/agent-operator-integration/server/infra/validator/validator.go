// Package validator 定义接口
// @file validator.go
// @description: 初始化验证器
package validator

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"regexp"
	"strings"
	"sync"
	"unicode/utf8"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	myErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	"github.com/asaskevich/govalidator"
	validatorv10 "github.com/go-playground/validator/v10"
)

const (
	defaultNameMaxLength = 50 // 算子名称最大长度(字符)
	defaultImpexLimit    = 10 //
)

// Validator 验证器接口
type validator struct {
	Validator           *validatorv10.Validate
	ImportMaxCount      int64 // 算子导入限制(单次导入最大算子数量)
	NameLimit           int64 // 算子名称限制
	DescLimit           int64 // 算子描述限制
	ImportFileSizeLimit int64 // 算子导入限制(单次导入最大文件大小)
}

var (
	vOnce sync.Once
	v     interfaces.Validator

	// 仅支持中文、字母、数字、下划线
	commonNameReg = `^[[:word:]\p{Han}]+$`
)

func NewValidator() interfaces.Validator {
	vOnce.Do(func() {
		conf := config.NewConfigLoader()
		v = &validator{
			Validator:           validatorv10.New(),
			ImportMaxCount:      conf.OperatorConfig.ImportOperatorMaxCount,
			NameLimit:           defaultNameMaxLength,
			DescLimit:           conf.OperatorConfig.DescLengthLimit,
			ImportFileSizeLimit: conf.OperatorConfig.ImportFileSizeLimit,
		}
	})
	return v
}

// init 初始化验证器
func init() {
	validator := validatorv10.New()
	// 自定义验证器使用的字段名称标签
	validator.RegisterTagNameFunc(func(fld reflect.StructField) string {
		// 从结构体字段的json标签中获取第一个值（忽略其他选项）
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0] //nolint:mnd

		// 如果标签设置为"-"则跳过该字段
		if name == "-" {
			return ""
		}
		// 返回json标签定义的字段名
		return name
	})
	_ = validator.RegisterValidation("uuid4", func(fl validatorv10.FieldLevel) bool {
		return govalidator.IsUUIDv4(fl.Field().String())
	})
}

// ValidateOperatorName 验证算子名称是否合法
// 仅支持中英文、数字和键盘上的特殊字符
func (v *validator) ValidateOperatorName(ctx context.Context, name string) (err error) {
	if name == "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtOperatorNameEmpty, "operator name cannot be empty")
		return
	}

	// 校验长度（按字符数计算）
	if utf8.RuneCountInString(name) > int(v.NameLimit) {
		err = fmt.Errorf("operator name %s length exceeds limit [%d]", name, v.NameLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtOperatorNameTooLong, err.Error(),
			v.NameLimit)
		return
	}

	matched, err := regexp.MatchString(commonNameReg, name)
	if err != nil {
		err = fmt.Errorf("operator name %s contains invalid characters %v", name, err)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtCommonNameInvalid, err.Error())
		return
	}
	if !matched {
		err = fmt.Errorf("operator name %s contains invalid characters", name)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtCommonNameInvalid, err.Error())
	}
	return
}

// ValidateOperatorDesc 验证算子描述是否合法
func (v *validator) ValidateOperatorDesc(ctx context.Context, desc string) (err error) {
	// 算子描述不允许为空
	if desc == "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtOperatorDescEmpty, "operator description cannot be empty")
		return
	}
	// 校验长度（按字符数计算）
	if utf8.RuneCountInString(desc) > int(v.DescLimit) {
		err = fmt.Errorf("operator description length exceeds limit [%d]", v.DescLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtOperatorDescTooLong, err.Error(), v.DescLimit)
	}
	return
}

// 校验算子导入数量是否超过限制
func (v *validator) ValidateOperatorImportCount(ctx context.Context, count int64) (err error) {
	if count == 0 {
		err = fmt.Errorf("operator import count %d is zero", count)
		err = myErr.NewHTTPError(ctx, http.StatusNotFound, myErr.ErrExtOperatorUnparsed, err.Error())
		return
	}
	if count > v.ImportMaxCount {
		err = fmt.Errorf("operator import count %d exceeds limit [%d]", count, v.ImportMaxCount)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtOperatorImportLimit, err.Error(),
			v.ImportMaxCount)
	}
	return
}

// 校验导入数据的大小是否超过限制
func (v *validator) ValidateOperatorImportSize(ctx context.Context, size int64) (err error) {
	// 将文件大小转换为MB
	if size < v.ImportFileSizeLimit {
		return
	}
	// 返回提示信息中，将当前限制转化为 B、KB、MB、GB、TB为单位的字符串
	sizeStr := utils.ConvertToBytes(v.ImportFileSizeLimit)
	err = fmt.Errorf("file size %d exceeds limit [%s]", size, sizeStr)
	err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtOperatorImportDataLimit,
		err.Error(), sizeStr)
	return
}

func (v *validator) ValidatorToolBoxName(ctx context.Context, name string) (err error) {
	if name == "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtToolBoxNameEmpty, "toolbox name cannot be empty")
		return
	}

	// 校验长度（按字符数计算）
	if utf8.RuneCountInString(name) > int(v.NameLimit) {
		err = fmt.Errorf("toolbox name %s length exceeds limit [%d]", name, v.NameLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtToolBoxNameLimit, err.Error(),
			v.NameLimit)
		return
	}
	matched, _ := regexp.MatchString(commonNameReg, name)
	if !matched {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtCommonNameInvalid,
			fmt.Sprintf("toolbox name %s format is invalid", name))
	}
	return
}

func (v *validator) ValidatorToolBoxDesc(ctx context.Context, desc string) (err error) {
	// 工具箱描述不允许为空
	if desc == "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtToolBoxDescEmpty, "toolbox description cannot be empty")
		return
	}
	// 校验长度（按字符数计算）
	if utf8.RuneCountInString(desc) > int(v.DescLimit) {
		err = fmt.Errorf("toolbox description length exceeds limit [%d]", v.DescLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtToolBoxDescLimit, err.Error(),
			v.DescLimit)
	}
	return
}
func (v *validator) ValidatorToolName(ctx context.Context, name string) (err error) {
	if name == "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtToolNameEmpty, "tool name cannot be empty")
		return
	}
	if utf8.RuneCountInString(name) > int(v.NameLimit) {
		err = fmt.Errorf("tool name length exceeds limit [%d]", v.NameLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtToolNameLimit, err.Error(),
			v.NameLimit)
	}
	matched, _ := regexp.MatchString(commonNameReg, name)
	if !matched {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtCommonNameInvalid,
			fmt.Sprintf("tool name %s format is invalid", name))
	}
	return
}
func (v *validator) ValidatorToolDesc(ctx context.Context, desc string) (err error) {
	// 工具描述不允许为空
	if desc == "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtToolDescEmpty, "tool description cannot be empty")
		return
	}
	if utf8.RuneCountInString(desc) > int(v.DescLimit) {
		err = fmt.Errorf("tool description length exceeds limit [%d]", v.DescLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtToolDescLimit, err.Error(),
			v.DescLimit)
	}
	return
}

// ValidatorIntCompVersion 验证内置组件版本
func (v *validator) ValidatorIntCompVersion(ctx context.Context, version string) (err error) {
	pattern := `^[0-9]+(\.[0-9]+){2,}$` // 允许x.y.z或更长格式（如x.y.z.w）
	matched, err := regexp.MatchString(pattern, version)
	if !matched || err != nil {
		err = fmt.Errorf("internal component version:%s, format is invalid", version)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtInternalToolBoxVersion, err.Error(),
			version)
	}
	return
}

func (v *validator) ValidatorMCPName(ctx context.Context, name string) (err error) {
	if name == "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtMCPNameEmpty, "mcp name cannot be empty")
		return
	}

	// 校验长度（按字符数计算）
	if utf8.RuneCountInString(name) > int(v.NameLimit) {
		err = fmt.Errorf("mcp name %s length exceeds limit [%d]", name, v.NameLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtMCPNameLimit, err.Error(),
			v.NameLimit)
		return
	}
	matched, _ := regexp.MatchString(commonNameReg, name)
	if !matched {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtCommonNameInvalid,
			fmt.Sprintf("mcp name %s format is invalid", name))
	}
	return
}

func (v *validator) ValidatorMCPDesc(ctx context.Context, desc string) (err error) {
	if utf8.RuneCountInString(desc) > int(v.DescLimit) {
		err = fmt.Errorf("mcp description length exceeds limit [%d]", v.DescLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtMCPDescLimit, err.Error(),
			v.DescLimit)
	}
	return
}

func (v *validator) ValidatorCategoryName(ctx context.Context, name string) (err error) {
	if name == "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtCategoryNameEmpty, "category name cannot be empty")
		return
	}

	// 校验长度（按字符数计算）
	if utf8.RuneCountInString(name) > int(v.NameLimit) {
		err = fmt.Errorf("category name %s length exceeds limit [%d]", name, v.NameLimit)
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtCategoryNameLimit, err.Error(),
			v.NameLimit)
		return
	}
	matched, _ := regexp.MatchString(commonNameReg, name)
	if !matched {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, myErr.ErrExtCommonNameInvalid,
			fmt.Sprintf("category name %s format is invalid", name))
	}
	return
}

// ValidatorStruct 验证结构体
func (v *validator) ValidatorStruct(ctx context.Context, obj interface{}) (err error) {
	err = v.Validator.Struct(obj)
	if err == nil {
		return
	}
	vErr := make(validatorv10.ValidationErrors, 0)
	if !errors.As(err, &vErr) {
		return
	}
	extCode := TagToErrorType[vErr[0].Tag()]
	if extCode != "" {
		err = myErr.NewHTTPError(ctx, http.StatusBadRequest, extCode, vErr[0].Error())
	}
	return
}
