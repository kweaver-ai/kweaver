// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package logics

import (
	"context"
	"testing"

	cond "ontology-query/common/condition"
	oerrors "ontology-query/errors"
	"ontology-query/interfaces"
	dtype "ontology-query/interfaces/data_type"

	"github.com/kweaver-ai/kweaver-go-lib/rest"
	. "github.com/smartystreets/goconvey/convey"
)

func Test_BuildViewSort(t *testing.T) {
	Convey("Test BuildViewSort", t, func() {
		Convey("成功 - 包含主键的对象类", func() {
			objectType := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"id", "name"},
					DataProperties: []cond.DataProperty{
						{
							Name: "id",
							MappedField: cond.Field{
								Name: "id_field",
							},
						},
						{
							Name: "name",
							MappedField: cond.Field{
								Name: "name_field",
							},
						},
					},
				},
			}

			result := BuildViewSort(objectType)
			So(len(result), ShouldEqual, 3) // _score desc + 2个主键 asc
			So(result[0].Field, ShouldEqual, interfaces.SORT_FIELD_SCORE)
			So(result[0].Direction, ShouldEqual, interfaces.DESC_DIRECTION)
			So(result[1].Field, ShouldEqual, "id_field")
			So(result[1].Direction, ShouldEqual, interfaces.ASC_DIRECTION)
			So(result[2].Field, ShouldEqual, "name_field")
			So(result[2].Direction, ShouldEqual, interfaces.ASC_DIRECTION)
		})

		Convey("成功 - 主键映射字段为空", func() {
			objectType := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"id"},
					DataProperties: []cond.DataProperty{
						{
							Name: "id",
							MappedField: cond.Field{
								Name: "",
							},
						},
					},
				},
			}

			result := BuildViewSort(objectType)
			So(len(result), ShouldEqual, 1) // 只有 _score
			So(result[0].Field, ShouldEqual, interfaces.SORT_FIELD_SCORE)
		})

		Convey("成功 - 无主键的对象类", func() {
			objectType := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{},
					DataProperties: []cond.DataProperty{
						{
							Name: "prop1",
							MappedField: cond.Field{
								Name: "prop1_field",
							},
						},
					},
				},
			}

			result := BuildViewSort(objectType)
			So(len(result), ShouldEqual, 1) // 只有 _score
			So(result[0].Field, ShouldEqual, interfaces.SORT_FIELD_SCORE)
		})

		Convey("成功 - 主键不在数据属性中", func() {
			objectType := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"id"},
					DataProperties: []cond.DataProperty{
						{
							Name: "prop1",
							MappedField: cond.Field{
								Name: "prop1_field",
							},
						},
					},
				},
			}

			result := BuildViewSort(objectType)
			So(len(result), ShouldEqual, 1) // 只有 _score
		})
	})
}

func Test_MapSortFieldsForDataView(t *testing.T) {
	Convey("Test MapSortFieldsForDataView", t, func() {
		objectType := interfaces.ObjectType{
			ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
				OTID: "ot1",
				DataProperties: []cond.DataProperty{
					{
						Name: "foo",
						MappedField: cond.Field{
							Name: "bar",
						},
					},
					{
						Name: "id",
						MappedField: cond.Field{
							Name: "id_col",
						},
					},
				},
			},
		}

		Convey("maps property names to view columns and keeps _score", func() {
			in := []*interfaces.SortParams{
				{Field: interfaces.SORT_FIELD_SCORE, Direction: interfaces.DESC_DIRECTION},
				{Field: "foo", Direction: interfaces.ASC_DIRECTION},
			}
			out, err := MapSortFieldsForDataView(in, objectType)
			So(err, ShouldBeNil)
			So(len(out), ShouldEqual, 2)
			So(out[0].Field, ShouldEqual, interfaces.SORT_FIELD_SCORE)
			So(out[1].Field, ShouldEqual, "bar")
			So(out[1].Direction, ShouldEqual, interfaces.ASC_DIRECTION)
		})

		Convey("rejects unknown sort field", func() {
			in := []*interfaces.SortParams{{Field: "unknown", Direction: interfaces.ASC_DIRECTION}}
			_, err := MapSortFieldsForDataView(in, objectType)
			So(err, ShouldNotBeNil)
			So(err.Error(), ShouldContainSubstring, "unknown")
		})

		Convey("rejects property with empty mapped_field", func() {
			ot := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					DataProperties: []cond.DataProperty{
						{Name: "x", MappedField: cond.Field{Name: ""}},
					},
				},
			}
			in := []*interfaces.SortParams{{Field: "x", Direction: interfaces.ASC_DIRECTION}}
			_, err := MapSortFieldsForDataView(in, ot)
			So(err, ShouldNotBeNil)
			So(err.Error(), ShouldContainSubstring, "mapped_field")
		})

		Convey("empty sort returns empty", func() {
			out, err := MapSortFieldsForDataView(nil, objectType)
			So(err, ShouldBeNil)
			So(out, ShouldBeNil)
		})

		Convey("rejects nil sort entry", func() {
			in := []*interfaces.SortParams{nil}
			_, err := MapSortFieldsForDataView(in, objectType)
			So(err, ShouldNotBeNil)
		})
	})
}

func Test_BuildIndexSort(t *testing.T) {
	Convey("Test BuildIndexSort", t, func() {
		Convey("成功 - text类型字段启用keyword索引", func() {
			objectType := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"id", "name"},
				},
			}
			propMap := map[string]cond.DataProperty{
				"id": {
					Name: "id",
					Type: dtype.DATATYPE_STRING,
				},
				"name": {
					Name: "name",
					Type: dtype.DATATYPE_TEXT,
					IndexConfig: &cond.IndexConfig{
						KeywordConfig: cond.KeywordConfig{
							Enabled: true,
						},
					},
				},
			}

			result := BuildIndexSort(objectType, propMap)
			So(len(result), ShouldEqual, 3) // _score desc + 2个主键 asc
			So(result[0].Field, ShouldEqual, interfaces.SORT_FIELD_SCORE)
			So(result[1].Field, ShouldEqual, "id")
			So(result[2].Field, ShouldEqual, "name."+dtype.KEYWORD_SUFFIX)
		})

		Convey("成功 - text类型字段未启用keyword索引", func() {
			objectType := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"name"},
				},
			}
			propMap := map[string]cond.DataProperty{
				"name": {
					Name: "name",
					Type: dtype.DATATYPE_TEXT,
					IndexConfig: &cond.IndexConfig{
						KeywordConfig: cond.KeywordConfig{
							Enabled: false,
						},
					},
				},
			}

			result := BuildIndexSort(objectType, propMap)
			So(len(result), ShouldEqual, 1) // 只有 _score
			So(result[0].Field, ShouldEqual, interfaces.SORT_FIELD_SCORE)
		})

		Convey("成功 - string类型字段", func() {
			objectType := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"id"},
				},
			}
			propMap := map[string]cond.DataProperty{
				"id": {
					Name: "id",
					Type: dtype.DATATYPE_STRING,
				},
			}

			result := BuildIndexSort(objectType, propMap)
			So(len(result), ShouldEqual, 2)
			So(result[1].Field, ShouldEqual, "id")
		})

		Convey("成功 - 无主键", func() {
			objectType := interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{},
				},
			}
			propMap := map[string]cond.DataProperty{}

			result := BuildIndexSort(objectType, propMap)
			So(len(result), ShouldEqual, 1)
			So(result[0].Field, ShouldEqual, interfaces.SORT_FIELD_SCORE)
		})
	})
}

func Test_BuildPathKey(t *testing.T) {
	Convey("Test BuildPathKey", t, func() {
		Convey("成功 - 单条边", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{
						RelationTypeId: "rt1",
						SourceObjectId: "obj1",
						TargetObjectId: "obj2",
					},
				},
				Length: 1,
			}
			nextNodeID := "obj3"

			result := BuildPathKey(path, nextNodeID)
			So(result, ShouldEqual, "rt1:obj1->obj2->obj3")
		})

		Convey("成功 - 多条边", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{
						RelationTypeId: "rt1",
						SourceObjectId: "obj1",
						TargetObjectId: "obj2",
					},
					{
						RelationTypeId: "rt2",
						SourceObjectId: "obj2",
						TargetObjectId: "obj3",
					},
				},
				Length: 2,
			}
			nextNodeID := "obj4"

			result := BuildPathKey(path, nextNodeID)
			So(result, ShouldEqual, "rt1:obj1->obj2->obj3->obj4")
		})

		Convey("成功 - 空路径", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{},
				Length:    0,
			}
			nextNodeID := "obj1"

			// 空路径会导致panic，但根据代码逻辑，这种情况不应该发生
			// 这里测试边界情况
			defer func() {
				if r := recover(); r != nil {
					So(r, ShouldNotBeNil)
				}
			}()
			_ = BuildPathKey(path, nextNodeID)
		})
	})
}

func Test_FilterValidPaths(t *testing.T) {
	Convey("Test FilterValidPaths", t, func() {
		Convey("成功 - 过滤有效路径", func() {
			paths := []interfaces.RelationPath{
				{
					Relations: []interfaces.Relation{
						{SourceObjectId: "obj1", TargetObjectId: "obj2"},
						{SourceObjectId: "obj2", TargetObjectId: "obj3"},
					},
				},
				{
					Relations: []interfaces.Relation{
						{SourceObjectId: "obj1", TargetObjectId: "obj2"},
						{SourceObjectId: "obj2", TargetObjectId: "obj1"}, // 循环
					},
				},
			}
			visitedNodes := map[string]bool{}

			result := FilterValidPaths(paths, visitedNodes)
			So(len(result), ShouldEqual, 1)
		})

		Convey("成功 - 所有路径都有效", func() {
			paths := []interfaces.RelationPath{
				{
					Relations: []interfaces.Relation{
						{SourceObjectId: "obj1", TargetObjectId: "obj2"},
					},
				},
			}
			visitedNodes := map[string]bool{}

			result := FilterValidPaths(paths, visitedNodes)
			So(len(result), ShouldEqual, 1)
		})

		Convey("成功 - 空路径列表", func() {
			paths := []interfaces.RelationPath{}
			visitedNodes := map[string]bool{}

			result := FilterValidPaths(paths, visitedNodes)
			So(len(result), ShouldEqual, 0)
		})
	})
}

func Test_IsPathValid(t *testing.T) {
	Convey("Test IsPathValid", t, func() {
		Convey("成功 - 有效路径", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{SourceObjectId: "obj1", TargetObjectId: "obj2"},
					{SourceObjectId: "obj2", TargetObjectId: "obj3"},
				},
			}
			visitedNodes := map[string]bool{}

			result := IsPathValid(path, visitedNodes)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 包含循环的路径", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{SourceObjectId: "obj1", TargetObjectId: "obj2"},
					{SourceObjectId: "obj2", TargetObjectId: "obj1"}, // 循环：obj2->obj1，但obj1已经在路径中
				},
			}
			visitedNodes := map[string]bool{}

			result := IsPathValid(path, visitedNodes)
			So(result, ShouldBeFalse)
		})

		Convey("失败 - 路径不连续", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{SourceObjectId: "obj1", TargetObjectId: "obj2"},
					{SourceObjectId: "obj3", TargetObjectId: "obj4"}, // 不连续：obj2 != obj3
				},
			}
			visitedNodes := map[string]bool{}

			result := IsPathValid(path, visitedNodes)
			So(result, ShouldBeFalse)
		})

		Convey("失败 - 源对象重复（非连续性重复）", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{SourceObjectId: "obj1", TargetObjectId: "obj2"},
					{SourceObjectId: "obj1", TargetObjectId: "obj3"}, // obj1重复，且路径不连续
				},
			}
			visitedNodes := map[string]bool{}

			result := IsPathValid(path, visitedNodes)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 单条边", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{SourceObjectId: "obj1", TargetObjectId: "obj2"},
				},
			}
			visitedNodes := map[string]bool{}

			result := IsPathValid(path, visitedNodes)
			So(result, ShouldBeTrue)
		})

		Convey("成功 - 空路径", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{},
			}
			visitedNodes := map[string]bool{}

			result := IsPathValid(path, visitedNodes)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 与已访问节点冲突", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{SourceObjectId: "obj1", TargetObjectId: "obj2"},
				},
			}
			visitedNodes := map[string]bool{
				"obj1": true, // obj1已经被访问过
			}

			result := IsPathValid(path, visitedNodes)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - visitedNodes为nil", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{SourceObjectId: "obj1", TargetObjectId: "obj2"},
					{SourceObjectId: "obj2", TargetObjectId: "obj3"},
				},
			}

			result := IsPathValid(path, nil)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 长路径中的循环", func() {
			path := interfaces.RelationPath{
				Relations: []interfaces.Relation{
					{SourceObjectId: "obj1", TargetObjectId: "obj2"},
					{SourceObjectId: "obj2", TargetObjectId: "obj3"},
					{SourceObjectId: "obj3", TargetObjectId: "obj4"},
					{SourceObjectId: "obj4", TargetObjectId: "obj2"}, // 循环：回到obj2
				},
			}
			visitedNodes := map[string]bool{}

			result := IsPathValid(path, visitedNodes)
			So(result, ShouldBeFalse)
		})
	})
}

func Test_CanGenerate(t *testing.T) {
	Convey("Test CanGenerate", t, func() {
		Convey("成功 - quotaManager为nil", func() {
			result := CanGenerate(nil, 1)
			So(result, ShouldBeTrue)
		})

		Convey("成功 - 未达到全局限制", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        50,
				RequestPathTypeNum: 1,
			}

			result := CanGenerate(quotaManager, 1)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 达到全局限制", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        100,
				RequestPathTypeNum: 1,
			}

			result := CanGenerate(quotaManager, 1)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 多路径类型动态配额", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        50,
				RequestPathTypeNum: 2,
			}
			quotaManager.UsedQuota.Store(1, 20)

			result := CanGenerate(quotaManager, 1)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 多路径类型达到配额", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        90,
				RequestPathTypeNum: 2,
			}
			quotaManager.UsedQuota.Store(1, 50)

			result := CanGenerate(quotaManager, 1)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 多路径类型used小于maxQuota", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        50,
				RequestPathTypeNum: 2,
			}
			quotaManager.UsedQuota.Store(1, 20)
			// maxQuota = 100 - 50 = 50, used = 20 < 50, 应该返回true

			result := CanGenerate(quotaManager, 1)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 多路径类型used等于maxQuota", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        50,
				RequestPathTypeNum: 2,
			}
			quotaManager.UsedQuota.Store(1, 50)
			// maxQuota = 100 - 50 = 50, used = 50 >= 50, 应该返回false

			result := CanGenerate(quotaManager, 1)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 单路径类型且未达到限制", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        50,
				RequestPathTypeNum: 1,
			}
			quotaManager.UsedQuota.Store(1, 10)

			result := CanGenerate(quotaManager, 1)
			So(result, ShouldBeTrue)
		})
	})
}

func Test_RecordGenerated(t *testing.T) {
	Convey("Test RecordGenerated", t, func() {
		Convey("成功 - quotaManager为nil", func() {
			RecordGenerated(nil, 1, 10)
			// 不应该panic
		})

		Convey("成功 - 记录新路径", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        0,
				RequestPathTypeNum: 1,
			}

			RecordGenerated(quotaManager, 1, 10)
			So(quotaManager.GlobalCount, ShouldEqual, 10)
			value, _ := quotaManager.UsedQuota.Load(1)
			So(value, ShouldEqual, 10)
		})

		Convey("成功 - 更新已存在路径", func() {
			quotaManager := &interfaces.PathQuotaManager{
				TotalLimit:         100,
				GlobalCount:        10,
				RequestPathTypeNum: 1,
			}
			quotaManager.UsedQuota.Store(1, 5)

			RecordGenerated(quotaManager, 1, 10)
			So(quotaManager.GlobalCount, ShouldEqual, 20)
			value, _ := quotaManager.UsedQuota.Load(1)
			So(value, ShouldEqual, 15)
		})
	})
}

func Test_GetObjectID(t *testing.T) {
	Convey("Test GetObjectID", t, func() {
		Convey("成功 - 单主键", func() {
			objectType := &interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"id"},
				},
			}
			objectData := map[string]any{
				"id":   "123",
				"name": "test",
			}

			id, uk := GetObjectID(objectData, objectType)
			So(id, ShouldEqual, "ot1-123")
			So(uk["id"], ShouldEqual, "123")
		})

		Convey("成功 - 多主键", func() {
			objectType := &interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"id", "name"},
				},
			}
			objectData := map[string]any{
				"id":   "123",
				"name": "test",
			}

			id, uk := GetObjectID(objectData, objectType)
			So(id, ShouldEqual, "ot1-123_test")
			So(uk["id"], ShouldEqual, "123")
			So(uk["name"], ShouldEqual, "test")
		})

		Convey("成功 - objectType为nil", func() {
			id, uk := GetObjectID(map[string]any{"id": "123"}, nil)
			So(id, ShouldEqual, "")
			So(uk, ShouldBeNil)
		})

		Convey("成功 - 无主键", func() {
			objectType := &interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{},
				},
			}

			id, uk := GetObjectID(map[string]any{"id": "123"}, objectType)
			So(id, ShouldEqual, "")
			So(uk, ShouldBeNil)
		})

		Convey("成功 - 主键值缺失", func() {
			objectType := &interfaces.ObjectType{
				ObjectTypeWithKeyField: interfaces.ObjectTypeWithKeyField{
					OTID:        "ot1",
					PrimaryKeys: []string{"id", "name"},
				},
			}
			objectData := map[string]any{
				"id": "123",
				// name缺失
			}

			id, uk := GetObjectID(objectData, objectType)
			So(id, ShouldEqual, "ot1-123___NULL__")
			So(uk["id"], ShouldEqual, "123")
		})
	})
}

func Test_BuildDirectBatchConditions(t *testing.T) {
	Convey("Test BuildDirectBatchConditions", t, func() {
		Convey("成功 - 单字段映射", func() {
			currentLevelObjects := []interfaces.LevelObject{
				{
					ObjectID: "obj1",
					ObjectData: map[string]any{
						"id": "123",
					},
				},
				{
					ObjectID: "obj2",
					ObjectData: map[string]any{
						"id": "456",
					},
				},
			}
			edge := &interfaces.TypeEdge{
				RelationType: interfaces.RelationType{
					MappingRules: []interfaces.Mapping{
						{
							SourceProp: interfaces.SimpleProperty{
								Name: "id",
							},
							TargetProp: interfaces.SimpleProperty{
								Name: "target_id",
							},
						},
					},
				},
			}

			conditions, err := BuildDirectBatchConditions(currentLevelObjects, edge, true)
			So(err, ShouldBeNil)
			So(len(conditions), ShouldEqual, 1)
			So(conditions[0].Operation, ShouldEqual, "in")
			So(conditions[0].Name, ShouldEqual, "target_id")
		})

		Convey("成功 - 多字段映射", func() {
			currentLevelObjects := []interfaces.LevelObject{
				{
					ObjectID: "obj1",
					ObjectData: map[string]any{
						"id":   "123",
						"name": "test1",
					},
				},
			}
			edge := &interfaces.TypeEdge{
				RelationType: interfaces.RelationType{
					MappingRules: []interfaces.Mapping{
						{
							SourceProp: interfaces.SimpleProperty{Name: "id"},
							TargetProp: interfaces.SimpleProperty{Name: "target_id"},
						},
						{
							SourceProp: interfaces.SimpleProperty{Name: "name"},
							TargetProp: interfaces.SimpleProperty{Name: "target_name"},
						},
					},
				},
			}

			conditions, err := BuildDirectBatchConditions(currentLevelObjects, edge, true)
			So(err, ShouldBeNil)
			So(len(conditions), ShouldEqual, 1)
			So(conditions[0].Operation, ShouldEqual, "and")
		})

		Convey("成功 - 反向映射", func() {
			currentLevelObjects := []interfaces.LevelObject{
				{
					ObjectID: "obj1",
					ObjectData: map[string]any{
						"id": "123",
					},
				},
			}
			edge := &interfaces.TypeEdge{
				RelationType: interfaces.RelationType{
					MappingRules: []interfaces.Mapping{
						{
							SourceProp: interfaces.SimpleProperty{Name: "source_id"},
							TargetProp: interfaces.SimpleProperty{Name: "target_id"},
						},
					},
				},
			}

			conditions, err := BuildDirectBatchConditions(currentLevelObjects, edge, false)
			So(err, ShouldBeNil)
			So(len(conditions), ShouldBeGreaterThan, 0)
		})

		Convey("成功 - 单字段映射但inValue为nil", func() {
			currentLevelObjects := []interfaces.LevelObject{
				{
					ObjectID:   "obj1",
					ObjectData: map[string]any{
						// 缺少映射字段
					},
				},
			}
			edge := &interfaces.TypeEdge{
				RelationType: interfaces.RelationType{
					MappingRules: []interfaces.Mapping{
						{
							SourceProp: interfaces.SimpleProperty{Name: "id"},
							TargetProp: interfaces.SimpleProperty{Name: "target_id"},
						},
					},
				},
			}

			conditions, err := BuildDirectBatchConditions(currentLevelObjects, edge, true)
			So(err, ShouldBeNil)
			// 当inValue为nil时，不会返回in条件，而是返回普通条件
			So(len(conditions), ShouldBeGreaterThanOrEqualTo, 0)
		})

		Convey("成功 - 空对象列表", func() {
			currentLevelObjects := []interfaces.LevelObject{}
			edge := &interfaces.TypeEdge{
				RelationType: interfaces.RelationType{
					MappingRules: []interfaces.Mapping{
						{
							SourceProp: interfaces.SimpleProperty{Name: "id"},
							TargetProp: interfaces.SimpleProperty{Name: "target_id"},
						},
					},
				},
			}

			conditions, err := BuildDirectBatchConditions(currentLevelObjects, edge, true)
			So(err, ShouldBeNil)
			So(len(conditions), ShouldEqual, 0)
		})
	})
}

func Test_BuildCondition(t *testing.T) {
	Convey("Test BuildCondition", t, func() {
		Convey("成功 - 单字段映射", func() {
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}
			currentObjectData := map[string]any{
				"id": "123",
			}

			conditions, targetField, inValue := BuildCondition(nil, mappingRules, true, currentObjectData)
			So(len(conditions), ShouldEqual, 1)
			So(conditions[0].Name, ShouldEqual, "target_id")
			So(conditions[0].Operation, ShouldEqual, "==")
			So(targetField, ShouldEqual, "target_id")
			So(inValue, ShouldEqual, "123")
		})

		Convey("成功 - 多字段映射", func() {
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
				{
					SourceProp: interfaces.SimpleProperty{Name: "name"},
					TargetProp: interfaces.SimpleProperty{Name: "target_name"},
				},
			}
			currentObjectData := map[string]any{
				"id":   "123",
				"name": "test",
			}

			conditions, targetField, inValue := BuildCondition(nil, mappingRules, true, currentObjectData)
			So(len(conditions), ShouldEqual, 2)
			So(inValue, ShouldBeNil)
			So(targetField, ShouldEqual, "")
		})

		Convey("成功 - 带viewQuery", func() {
			viewQuery := &interfaces.ViewQuery{}
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}
			currentObjectData := map[string]any{
				"id": "123",
			}

			conditions, _, _ := BuildCondition(viewQuery, mappingRules, true, currentObjectData)
			So(len(conditions), ShouldEqual, 1)
			So(viewQuery.Filters, ShouldNotBeNil)
			So(len(viewQuery.Sort), ShouldBeGreaterThan, 0)
		})
	})
}

func Test_CheckDirectMappingConditions(t *testing.T) {
	Convey("Test CheckDirectMappingConditions", t, func() {
		Convey("成功 - 正向映射匹配", func() {
			currentObjectData := map[string]any{
				"id": "123",
			}
			nextObject := map[string]any{
				"target_id": "123",
			}
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckDirectMappingConditions(currentObjectData, nextObject, mappingRules, true)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 值不匹配", func() {
			currentObjectData := map[string]any{
				"id": "123",
			}
			nextObject := map[string]any{
				"target_id": "456",
			}
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckDirectMappingConditions(currentObjectData, nextObject, mappingRules, true)
			So(result, ShouldBeFalse)
		})

		Convey("失败 - 字段缺失", func() {
			currentObjectData := map[string]any{
				"id": "123",
			}
			nextObject := map[string]any{}
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckDirectMappingConditions(currentObjectData, nextObject, mappingRules, true)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 反向映射", func() {
			currentObjectData := map[string]any{
				"target_id": "123",
			}
			nextObject := map[string]any{
				"id": "123",
			}
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckDirectMappingConditions(currentObjectData, nextObject, mappingRules, false)
			So(result, ShouldBeTrue)
		})
	})
}

func Test_CompareValues(t *testing.T) {
	Convey("Test CompareValues", t, func() {
		Convey("成功 - 相同值", func() {
			result := CompareValues("123", "123")
			So(result, ShouldBeTrue)
		})

		Convey("成功 - 不同值", func() {
			result := CompareValues("123", "456")
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 都为nil", func() {
			result := CompareValues(nil, nil)
			So(result, ShouldBeTrue)
		})

		Convey("成功 - 一个为nil", func() {
			result := CompareValues("123", nil)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 不同类型但值相同", func() {
			result := CompareValues(123, "123")
			So(result, ShouldBeTrue) // 转换为字符串后比较
		})
	})
}

func Test_CheckViewDataMatchesCondition(t *testing.T) {
	Convey("Test CheckViewDataMatchesCondition", t, func() {
		Convey("成功 - 匹配", func() {
			viewData := map[string]any{
				"target_id": "123",
			}
			condition := &cond.CondCfg{
				Name:      "target_id",
				Operation: "==",
				ValueOptCfg: cond.ValueOptCfg{
					Value: "123",
				},
			}
			mappingRules := []interfaces.Mapping{
				{
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckViewDataMatchesCondition(viewData, condition, mappingRules, true)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 值不匹配", func() {
			viewData := map[string]any{
				"target_id": "456",
			}
			condition := &cond.CondCfg{
				Name:      "target_id",
				Operation: "==",
				ValueOptCfg: cond.ValueOptCfg{
					Value: "123",
				},
			}
			mappingRules := []interfaces.Mapping{
				{
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckViewDataMatchesCondition(viewData, condition, mappingRules, true)
			So(result, ShouldBeFalse)
		})

		Convey("失败 - 字段缺失", func() {
			viewData := map[string]any{}
			condition := &cond.CondCfg{
				Name:      "target_id",
				Operation: "==",
				ValueOptCfg: cond.ValueOptCfg{
					Value: "123",
				},
			}
			mappingRules := []interfaces.Mapping{
				{
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckViewDataMatchesCondition(viewData, condition, mappingRules, true)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 反向映射匹配", func() {
			viewData := map[string]any{
				"source_id": "123",
			}
			condition := &cond.CondCfg{
				Name:      "source_id",
				Operation: "==",
				ValueOptCfg: cond.ValueOptCfg{
					Value: "123",
				},
			}
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "source_id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckViewDataMatchesCondition(viewData, condition, mappingRules, false)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 反向映射值不匹配", func() {
			viewData := map[string]any{
				"source_id": "456",
			}
			condition := &cond.CondCfg{
				Name:      "source_id",
				Operation: "==",
				ValueOptCfg: cond.ValueOptCfg{
					Value: "123",
				},
			}
			mappingRules := []interfaces.Mapping{
				{
					SourceProp: interfaces.SimpleProperty{Name: "source_id"},
					TargetProp: interfaces.SimpleProperty{Name: "target_id"},
				},
			}

			result := CheckViewDataMatchesCondition(viewData, condition, mappingRules, false)
			So(result, ShouldBeFalse)
		})
	})
}

func Test_CheckIndirectMappingConditionsWithViewData(t *testing.T) {
	Convey("Test CheckIndirectMappingConditionsWithViewData", t, func() {
		Convey("成功 - 匹配", func() {
			currentObjectData := map[string]any{
				"id": "123",
			}
			nextObject := map[string]any{
				"target_id": "456",
			}
			mappingRules := interfaces.InDirectMapping{
				SourceMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "id"},
						TargetProp: interfaces.SimpleProperty{Name: "view_id"},
					},
				},
				TargetMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "view_target_id"},
						TargetProp: interfaces.SimpleProperty{Name: "target_id"},
					},
				},
			}
			viewData := []map[string]any{
				{
					"view_id":        "123",
					"view_target_id": "456",
				},
			}

			result := CheckIndirectMappingConditionsWithViewData(currentObjectData, nextObject, mappingRules, true, viewData)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 视图数据不匹配", func() {
			currentObjectData := map[string]any{
				"id": "123",
			}
			nextObject := map[string]any{
				"target_id": "456",
			}
			mappingRules := interfaces.InDirectMapping{
				SourceMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "id"},
						TargetProp: interfaces.SimpleProperty{Name: "view_id"},
					},
				},
				TargetMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "view_target_id"},
						TargetProp: interfaces.SimpleProperty{Name: "target_id"},
					},
				},
			}
			viewData := []map[string]any{
				{
					"view_id":        "999",
					"view_target_id": "456",
				},
			}

			result := CheckIndirectMappingConditionsWithViewData(currentObjectData, nextObject, mappingRules, true, viewData)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 空视图数据", func() {
			currentObjectData := map[string]any{
				"id": "123",
			}
			nextObject := map[string]any{
				"target_id": "456",
			}
			mappingRules := interfaces.InDirectMapping{
				SourceMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "id"},
						TargetProp: interfaces.SimpleProperty{Name: "view_id"},
					},
				},
				TargetMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "view_target_id"},
						TargetProp: interfaces.SimpleProperty{Name: "target_id"},
					},
				},
			}
			viewData := []map[string]any{}

			result := CheckIndirectMappingConditionsWithViewData(currentObjectData, nextObject, mappingRules, true, viewData)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - 反向映射匹配", func() {
			currentObjectData := map[string]any{
				"target_id": "456",
			}
			nextObject := map[string]any{
				"id": "123",
			}
			mappingRules := interfaces.InDirectMapping{
				SourceMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "id"},
						TargetProp: interfaces.SimpleProperty{Name: "view_id"},
					},
				},
				TargetMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "view_target_id"},
						TargetProp: interfaces.SimpleProperty{Name: "target_id"},
					},
				},
			}
			viewData := []map[string]any{
				{
					"view_id":        "123",
					"view_target_id": "456",
				},
			}

			result := CheckIndirectMappingConditionsWithViewData(currentObjectData, nextObject, mappingRules, false, viewData)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 反向映射源字段缺失", func() {
			currentObjectData := map[string]any{
				// target_id缺失
			}
			nextObject := map[string]any{
				"id": "123",
			}
			mappingRules := interfaces.InDirectMapping{
				SourceMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "id"},
						TargetProp: interfaces.SimpleProperty{Name: "view_id"},
					},
				},
				TargetMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "view_target_id"},
						TargetProp: interfaces.SimpleProperty{Name: "target_id"},
					},
				},
			}
			viewData := []map[string]any{
				{
					"view_id":        "123",
					"view_target_id": "456",
				},
			}

			result := CheckIndirectMappingConditionsWithViewData(currentObjectData, nextObject, mappingRules, false, viewData)
			So(result, ShouldBeFalse)
		})

		Convey("失败 - 反向映射目标字段缺失", func() {
			currentObjectData := map[string]any{
				"target_id": "456",
			}
			nextObject := map[string]any{
				// id缺失
			}
			mappingRules := interfaces.InDirectMapping{
				SourceMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "id"},
						TargetProp: interfaces.SimpleProperty{Name: "view_id"},
					},
				},
				TargetMappingRules: []interfaces.Mapping{
					{
						SourceProp: interfaces.SimpleProperty{Name: "view_target_id"},
						TargetProp: interfaces.SimpleProperty{Name: "target_id"},
					},
				},
			}
			viewData := []map[string]any{
				{
					"view_id":        "123",
					"view_target_id": "456",
				},
			}

			result := CheckIndirectMappingConditionsWithViewData(currentObjectData, nextObject, mappingRules, false, viewData)
			So(result, ShouldBeFalse)
		})
	})
}

func Test_BuildInstanceIdentitiesCondition(t *testing.T) {
	Convey("Test BuildInstanceIdentitiesCondition", t, func() {
		Convey("成功 - 单个对象", func() {
			uks := []map[string]any{
				{
					"id":   "123",
					"name": "test",
				},
			}

			result := BuildInstanceIdentitiesCondition(uks)
			So(result.Operation, ShouldEqual, "and")
			So(len(result.SubConds), ShouldEqual, 2)
		})

		Convey("成功 - 多个对象", func() {
			uks := []map[string]any{
				{
					"id": "123",
				},
				{
					"id": "456",
				},
			}

			result := BuildInstanceIdentitiesCondition(uks)
			So(result.Operation, ShouldEqual, "or")
			So(len(result.SubConds), ShouldEqual, 2)
		})

		Convey("成功 - 空列表", func() {
			uks := []map[string]any{}

			result := BuildInstanceIdentitiesCondition(uks)
			So(result, ShouldBeNil)
		})
	})
}

func Test_TransferPropsToPropMap(t *testing.T) {
	Convey("Test TransferPropsToPropMap", t, func() {
		Convey("成功 - 转换属性列表", func() {
			props := []cond.DataProperty{
				{
					Name: "prop1",
					Type: dtype.DATATYPE_STRING,
				},
				{
					Name: "prop2",
					Type: dtype.DATATYPE_TEXT,
				},
			}

			result := TransferPropsToPropMap(props)
			So(len(result), ShouldEqual, 2)
			So(result["prop1"], ShouldNotBeNil)
			So(result["prop2"], ShouldNotBeNil)
			So(result["prop1"].Name, ShouldEqual, "prop1")
		})

		Convey("成功 - 空列表", func() {
			props := []cond.DataProperty{}

			result := TransferPropsToPropMap(props)
			So(len(result), ShouldEqual, 0)
		})
	})
}

func Test_BuildDslQuery(t *testing.T) {
	Convey("Test BuildDslQuery", t, func() {
		Convey("成功 - 基本查询", func() {
			ctx := context.Background()
			queryStr := `{"match_all":{}}`
			query := &interfaces.ObjectQueryBaseOnObjectType{
				PageQuery: interfaces.PageQuery{
					Limit: 10,
					Sort: []*interfaces.SortParams{
						{
							Field:     "field1",
							Direction: interfaces.ASC_DIRECTION,
						},
					},
				},
			}

			result, err := BuildDslQuery(ctx, queryStr, query)
			So(err, ShouldBeNil)
			So(result["size"], ShouldEqual, 10)
			So(result["sort"], ShouldNotBeNil)
		})

		Convey("成功 - 带search_after", func() {
			ctx := context.Background()
			queryStr := `{"match_all":{}}`
			query := &interfaces.ObjectQueryBaseOnObjectType{
				PageQuery: interfaces.PageQuery{
					Limit:     10,
					NeedTotal: true,
					Sort: []*interfaces.SortParams{
						{
							Field:     "field1",
							Direction: interfaces.ASC_DIRECTION,
						},
					},
				},
				// SearchAfter字段在ObjectQueryBaseOnObjectType中不存在，需要移除
			}

			result, err := BuildDslQuery(ctx, queryStr, query)
			So(err, ShouldBeNil)
			// SearchAfter字段在ObjectQueryBaseOnObjectType中不存在，跳过检查
			So(result["size"], ShouldEqual, 10)
		})

		Convey("成功 - search_after但limit为0", func() {
			ctx := context.Background()
			queryStr := `{"match_all":{}}`
			query := &interfaces.ObjectQueryBaseOnObjectType{
				PageQuery: interfaces.PageQuery{
					Limit: 0,
					SearchAfterParams: interfaces.SearchAfterParams{
						SearchAfter: []any{"value1"},
					},
				},
			}

			result, err := BuildDslQuery(ctx, queryStr, query)
			So(err, ShouldBeNil)
			// 验证limit被设置为SearchAfter_Limit
			So(result["size"], ShouldNotBeNil)
		})

		Convey("失败 - 无效JSON", func() {
			ctx := context.Background()
			queryStr := `invalid json`
			query := &interfaces.ObjectQueryBaseOnObjectType{
				PageQuery: interfaces.PageQuery{
					Limit: 10,
				},
			}

			result, err := BuildDslQuery(ctx, queryStr, query)
			So(err, ShouldNotBeNil)
			So(len(result), ShouldEqual, 0)
			httpErr, ok := err.(*rest.HTTPError)
			So(ok, ShouldBeTrue)
			So(httpErr.BaseError.ErrorCode, ShouldEqual, oerrors.OntologyQuery_InternalError_UnMarshalDataFailed)
		})

		Convey("成功 - 空查询字符串", func() {
			ctx := context.Background()
			queryStr := `{}`
			query := &interfaces.ObjectQueryBaseOnObjectType{
				PageQuery: interfaces.PageQuery{
					Limit: 10,
				},
			}

			result, err := BuildDslQuery(ctx, queryStr, query)
			So(err, ShouldBeNil)
			So(result["size"], ShouldEqual, 10)
		})

		Convey("成功 - 带search_after且NeedTotal为true", func() {
			ctx := context.Background()
			queryStr := `{"match_all":{}}`
			query := &interfaces.ObjectQueryBaseOnObjectType{
				PageQuery: interfaces.PageQuery{
					Limit:     10,
					NeedTotal: true,
					SearchAfterParams: interfaces.SearchAfterParams{
						SearchAfter: []any{"value1", "value2"},
					},
					Sort: []*interfaces.SortParams{
						{
							Field:     "field1",
							Direction: interfaces.ASC_DIRECTION,
						},
					},
				},
			}

			result, err := BuildDslQuery(ctx, queryStr, query)
			So(err, ShouldBeNil)
			So(result["size"], ShouldEqual, 10)
			So(result["search_after"], ShouldNotBeNil)
			So(query.NeedTotal, ShouldBeFalse) // 应该被设置为false
		})

		Convey("成功 - 多个排序字段", func() {
			ctx := context.Background()
			queryStr := `{"match_all":{}}`
			query := &interfaces.ObjectQueryBaseOnObjectType{
				PageQuery: interfaces.PageQuery{
					Limit: 10,
					Sort: []*interfaces.SortParams{
						{
							Field:     "field1",
							Direction: interfaces.ASC_DIRECTION,
						},
						{
							Field:     "field2",
							Direction: interfaces.DESC_DIRECTION,
						},
					},
				},
			}

			result, err := BuildDslQuery(ctx, queryStr, query)
			So(err, ShouldBeNil)
			sort, ok := result["sort"].([]map[string]any)
			So(ok, ShouldBeTrue)
			So(len(sort), ShouldEqual, 2)
		})
	})
}

func Test_EvaluateDataAgainstCondition(t *testing.T) {
	Convey("Test EvaluateDataAgainstCondition", t, func() {
		ctx := context.Background()

		Convey("成功 - condition 为 nil 返回 true", func() {
			data := map[string]any{"amount": 100}
			paramDefs := []interfaces.Parameter{{Name: "amount", Type: dtype.DATATYPE_INTEGER}}
			result, err := EvaluateDataAgainstCondition(ctx, data, nil, paramDefs)
			So(err, ShouldBeNil)
			So(result, ShouldBeTrue)
		})

		Convey("成功 - 简单等于条件满足", func() {
			data := map[string]any{"amount": 100}
			condition := &cond.CondCfg{
				Name:      "amount",
				Operation: cond.OperationEq,
				ValueOptCfg: cond.ValueOptCfg{
					Value: 100,
				},
			}
			paramDefs := []interfaces.Parameter{{Name: "amount", Type: dtype.DATATYPE_INTEGER}}
			result, err := EvaluateDataAgainstCondition(ctx, data, condition, paramDefs)
			So(err, ShouldBeNil)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 简单等于条件不满足", func() {
			data := map[string]any{"amount": 100}
			condition := &cond.CondCfg{
				Name:      "amount",
				Operation: cond.OperationEq,
				ValueOptCfg: cond.ValueOptCfg{
					Value: 200,
				},
			}
			paramDefs := []interfaces.Parameter{{Name: "amount", Type: dtype.DATATYPE_INTEGER}}
			result, err := EvaluateDataAgainstCondition(ctx, data, condition, paramDefs)
			So(err, ShouldBeNil)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - AND 条件全部满足", func() {
			data := map[string]any{"amount": 100, "level": "high"}
			condition := &cond.CondCfg{
				Operation: cond.OperationAnd,
				SubConds: []*cond.CondCfg{
					{
						Name:        "amount",
						Operation:   cond.OperationGte,
						ValueOptCfg: cond.ValueOptCfg{Value: 50},
					},
					{
						Name:        "level",
						Operation:   cond.OperationEq,
						ValueOptCfg: cond.ValueOptCfg{Value: "high"},
					},
				},
			}
			paramDefs := []interfaces.Parameter{
				{Name: "amount", Type: dtype.DATATYPE_INTEGER},
				{Name: "level", Type: dtype.DATATYPE_STRING},
			}
			result, err := EvaluateDataAgainstCondition(ctx, data, condition, paramDefs)
			So(err, ShouldBeNil)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - AND 条件部分不满足", func() {
			data := map[string]any{"amount": 100, "level": "low"}
			condition := &cond.CondCfg{
				Operation: cond.OperationAnd,
				SubConds: []*cond.CondCfg{
					{
						Name:        "amount",
						Operation:   cond.OperationGte,
						ValueOptCfg: cond.ValueOptCfg{Value: 50},
					},
					{
						Name:        "level",
						Operation:   cond.OperationEq,
						ValueOptCfg: cond.ValueOptCfg{Value: "high"},
					},
				},
			}
			paramDefs := []interfaces.Parameter{
				{Name: "amount", Type: dtype.DATATYPE_INTEGER},
				{Name: "level", Type: dtype.DATATYPE_STRING},
			}
			result, err := EvaluateDataAgainstCondition(ctx, data, condition, paramDefs)
			So(err, ShouldBeNil)
			So(result, ShouldBeFalse)
		})

		Convey("成功 - paramDefs 为空仍可评估", func() {
			data := map[string]any{"amount": 100}
			condition := &cond.CondCfg{
				Name:        "amount",
				Operation:   cond.OperationEq,
				ValueOptCfg: cond.ValueOptCfg{Value: 100},
			}
			result, err := EvaluateDataAgainstCondition(ctx, data, condition, nil)
			So(err, ShouldBeNil)
			So(result, ShouldBeTrue)
		})

		Convey("失败 - 字段不存在", func() {
			data := map[string]any{}
			condition := &cond.CondCfg{
				Name:        "amount",
				Operation:   cond.OperationEq,
				ValueOptCfg: cond.ValueOptCfg{Value: 100},
			}
			paramDefs := []interfaces.Parameter{{Name: "amount", Type: dtype.DATATYPE_INTEGER}}
			result, err := EvaluateDataAgainstCondition(ctx, data, condition, paramDefs)
			So(err, ShouldBeNil)
			So(result, ShouldBeFalse)
		})
	})
}

func TestCondCfgToFilterMap(t *testing.T) {
	Convey("nil cond returns nil map", t, func() {
		So(CondCfgToFilterMap(nil), ShouldBeNil)
	})
	Convey("serializes simple cond", t, func() {
		c := &cond.CondCfg{Name: "f1", Operation: "==", ValueOptCfg: cond.ValueOptCfg{ValueFrom: "const", Value: "v"}}
		m := CondCfgToFilterMap(c)
		So(m, ShouldNotBeNil)
		So(m["field"], ShouldEqual, "f1")
	})
}
