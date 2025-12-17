package common

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
)

// GetLanguageFromCtx 从context中获取语言设置
func GetLanguageFromCtx(ctx context.Context) Language {
	return GetLanguageByCtx(ctx)
}

// SetLanguageToCtx 设置语言到context
func SetLanguageToCtx(ctx context.Context, languageInfo Language) context.Context {
	return SetLanguageByCtx(ctx, languageInfo)
}
func SetPublicAPIToCtx(ctx context.Context, isPublic bool) context.Context {
	return context.WithValue(ctx, interfaces.IsPublic, isPublic)
}

// IsPublicAPIFromCtx 判断是否为公开API
func IsPublicAPIFromCtx(ctx context.Context) bool {
	if isPublic, ok := ctx.Value(interfaces.IsPublic).(bool); ok {
		return isPublic
	}
	return false
}

// SetAccountAuthContextToCtx 设置账户认证上下文到context
func SetAccountAuthContextToCtx(ctx context.Context, authContext *interfaces.AccountAuthContext) context.Context {
	return context.WithValue(ctx, interfaces.KeyAccountAuthContext, authContext)
}

func GetAccountAuthContextFromCtx(ctx context.Context) (*interfaces.AccountAuthContext, bool) {
	authContext, ok := ctx.Value(interfaces.KeyAccountAuthContext).(*interfaces.AccountAuthContext)
	return authContext, ok
}

// GetTokenInfoFromCtx 从context中获取token信息
func GetTokenInfoFromCtx(ctx context.Context) (*interfaces.TokenInfo, bool) {
	authContext, ok := GetAccountAuthContextFromCtx(ctx)
	if !ok {
		return nil, false
	}
	if authContext.TokenInfo == nil {
		return nil, false
	}
	return authContext.TokenInfo, true
}

// GetHeaderFromCtx 请求外部接口时，从context中获取Header参数传递
func GetHeaderFromCtx(ctx context.Context) (header map[string]string) {
	header = map[string]string{}
	authContext, ok := GetAccountAuthContextFromCtx(ctx)
	if !ok {
		return
	}
	header[string(interfaces.HeaderXAccountID)] = authContext.AccountID
	header[string(interfaces.HeaderXAccountType)] = string(authContext.AccountType)
	return
}
