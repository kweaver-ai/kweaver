// 本文件由TRAE贡献

package businessdomain

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"system-backend/internal/midware"
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/usermgnt"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// setupTestRouter 设置测试路由，只关注 ShouldBindJSON 逻辑
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// 添加中间件设置 AuthContext
	r.Use(func(c *gin.Context) {
		c.Set(midware.KeyAuthContext, &midware.AuthContext{
			Token: "test-token",
			Operator: &auditlog.Toperator{
				ID:   "test-operator",
				Name: "Test Operator",
			},
			UserInfo: &usermgnt.UserInfo{
				ID:    "test-user",
				Name:  "Test User",
				Roles: []string{"super_admin"},
			},
		})
		c.Next()
	})

	// 只测试 ShouldBindJSON 逻辑的处理函数
	r.POST("/api/business-domain/:bdid/members", func(c *gin.Context) {
		var requestData memberEditRequest

		if err := c.ShouldBindJSON(&requestData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    "BAD_REQUEST",
				"message": "failed to parse query parameters",
				"cause":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success"})
	})

	return r
}

// TestMemberEdit_ValidRequest 测试有效请求参数
func TestMemberEdit_ValidRequest(t *testing.T) {
	r := setupTestRouter()

	// 创建有效的请求体
	validRequest := memberEditRequest{
		Add: []memberEditRequestItem{
			{
				ID:   "user1",
				Type: "user",
				Role: "administrator",
			},
		},
		Update: []memberEditRequestItem{
			{
				ID:   "user2",
				Type: "user",
				Role: "developer",
			},
		},
		Remove: []memberRemoveRequestItem{
			{
				ID:   "user3",
				Type: "user",
			},
		},
	}

	requestBody, _ := json.Marshal(validRequest)
	req, _ := http.NewRequest("POST", "/api/business-domain/test-bd-id/members", bytes.NewBuffer(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	t.Log(w.Body.String())

	assert.Equal(t, http.StatusOK, w.Code)
}

// TestMemberEdit_InvalidRequest_MissingRequiredFields 测试缺少必填字段
func TestMemberEdit_InvalidRequest_MissingRequiredFields(t *testing.T) {
	r := setupTestRouter()

	// 测试缺少id字段
	invalidRequest := memberEditRequest{
		Add: []memberEditRequestItem{
			{
				Type: "user", // 缺少ID
				Role: "administrator",
			},
		},
	}

	requestBody, _ := json.Marshal(invalidRequest)
	req, _ := http.NewRequest("POST", "/api/business-domain/test-bd-id/members", bytes.NewBuffer(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestMemberEdit_InvalidRequest_InvalidRole 测试无效的role值
func TestMemberEdit_InvalidRequest_InvalidRole(t *testing.T) {
	r := setupTestRouter()

	// 测试无效的role值
	invalidRequest := memberEditRequest{
		Add: []memberEditRequestItem{
			{
				ID:   "user1",
				Type: "user",
				Role: "invalid_role", // 无效的role值
			},
		},
	}

	requestBody, _ := json.Marshal(invalidRequest)
	req, _ := http.NewRequest("POST", "/api/business-domain/test-bd-id/members", bytes.NewBuffer(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestMemberEdit_InvalidRequest_InvalidORole(t *testing.T) {
	r := setupTestRouter()

	// 测试无效的role值
	invalidRequest := memberEditRequest{
		Add: []memberEditRequestItem{
			{
				ID:    "user1",
				Type:  "user",
				Role:  "administrator",
				ORole: "invalid_orole", // 无效的orole值
			},
		},
	}

	requestBody, _ := json.Marshal(invalidRequest)
	req, _ := http.NewRequest("POST", "/api/business-domain/test-bd-id/members", bytes.NewBuffer(requestBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	t.Log(w.Body.String())

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
