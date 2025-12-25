package main

import (
	"errors"
	"os/exec"
	"reflect"
	"testing"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ECron/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ECron/mock"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ECron/utils"
	monkey "devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/Monkey"
	"github.com/golang/mock/gomock"
	"github.com/mitchellh/mapstructure"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/assert"
)

func newExecutor(h utils.HTTPClient) *executor {
	return &executor{httpClient: h}
}

func TestExecuteJob(t *testing.T) {
	Convey("ExecuteJob", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		h := mock.NewMockHTTPClient(ctrl)
		executor := newExecutor(h)

		Convey("not supported execution mode", func() {
			reqParam := common.JobInfo{
				JobName:     "test",
				JobType:     common.TIMING,
				JobCronTime: "*/10 * * * * ?",
			}
			reply, err := executor.ExecuteJob(reqParam)
			assert.Equal(t, err.Error(), common.ErrUnsupportedExecutionMode)
			assert.Equal(t, reply, false)
		})

		Convey("mode", func() {
			Convey("http delete success", func() {
				h.EXPECT().Delete(gomock.Any(), gomock.Any(), gomock.Any()).AnyTimes().Return(nil)

				reqParam := common.JobInfo{
					JobName:     "test",
					JobType:     common.TIMING,
					JobCronTime: "*/10 * * * * ?",
					Context: common.JobContext{
						Mode: common.HTTP,
						Info: common.JobContextInfo{
							Method: "DELETE",
						},
					},
				}
				reply, err := executor.ExecuteJob(reqParam)
				assert.Equal(t, err, nil)
				assert.Equal(t, reply, false)
			})

			Convey("https post failed", func() {
				h.EXPECT().Post(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).AnyTimes().Return(errors.New("failed"))

				reqParam := common.JobInfo{
					JobName:     "test",
					JobType:     common.TIMING,
					JobCronTime: "*/10 * * * * ?",
					Context: common.JobContext{
						Mode: common.HTTPS,
					},
				}
				reply, err := executor.ExecuteJob(reqParam)
				assert.NotEqual(t, err, nil)
				assert.Equal(t, reply, true)
			})
		})

		Convey("exe mode, kubernetes job", func() {
			job := common.JobInfo{
				JobName:     "test",
				JobType:     common.TIMING,
				JobCronTime: "*/10 * * * * ?",
				Context: common.JobContext{
					Mode: common.EXE,
					Exec: "python -a 1 -b 2",
					Info: common.JobContextInfo{
						Kubernetes: map[string]interface{}{
							"addr":  "localhost",
							"port":  12345,
							"image": "acr/aishu.cn/as/abc:1.0.0",
						},
					},
				},
			}

			Convey("mapstructure decode failed", func() {
				guard := monkey.Patch(mapstructure.Decode, func(input interface{}, output interface{}) error {
					return errors.New("failed")
				})
				defer guard.Unpatch()

				reply, err := executor.ExecuteJob(job)
				assert.NotEqual(t, err, nil)
				assert.Equal(t, reply, false)
			})

			h.EXPECT().Post(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).AnyTimes().Return(nil)

			Convey("normal, no body", func() {
				reply, err := executor.ExecuteJob(job)
				assert.Equal(t, err, nil)
				assert.Equal(t, reply, true)
			})

			Convey("normal, has body", func() {
				job.Context.Info.Body = map[string]interface{}{
					"apiVersion": "batch/v1",
				}
				reply, err := executor.ExecuteJob(job)
				assert.Equal(t, err, nil)
				assert.Equal(t, reply, true)
			})
		})

		Convey("exe mode, local job", func() {
			h.EXPECT().Post(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).AnyTimes().Return(nil)

			var c *exec.Cmd
			guard := monkey.PatchInstanceMethod(reflect.TypeOf(c), "Run", func(_ *exec.Cmd) error {
				return nil
			})
			defer guard.Unpatch()

			job := common.JobInfo{
				JobName:     "test",
				JobType:     common.TIMING,
				JobCronTime: "*/10 * * * * ?",
				Context: common.JobContext{
					Mode: common.EXE,
					Exec: "python -a 1 -b 2",
					Info: common.JobContextInfo{
						Params: map[string]string{
							"-c": "3",
						},
					},
				},
			}
			reply, err := executor.ExecuteJob(job)
			assert.Equal(t, err, nil)
			assert.Equal(t, reply, true)
		})
	})
}

func TestGetCmd(t *testing.T) {
	Convey("getCmd", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		h := mock.NewMockHTTPClient(ctrl)
		executor := newExecutor(h)

		name, args, command := executor.getCmd("python -a 1 -b 2", map[string]string{
			"p1": "-c",
		})
		assert.Equal(t, name, "python")
		assert.Equal(t, args, []string{"-a", "1", "-b", "2", "-c"})
		assert.Equal(t, command, "[\"python\",\"-a\",\"1\",\"-b\",\"2\",\"-c\"]")
	})
}
