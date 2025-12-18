package rds

import "fmt"

// Options 查询选项
type Options struct {
	OrderBy       *string
	Order         *string
	Limit         *int64
	Page          *int64
	SearchOptions []*SearchOption
}

// SearchOption 搜索选项
type SearchOption struct {
	Col       string
	Val       interface{}
	Condition string
}

// BuildQuery 构建查询语句
func (opt *Options) BuildQuery(baseQuery string) (sqlStr string, searchSqlVal []interface{}) {
	sqlStr = baseQuery
	if opt == nil {
		return
	}

	if len(opt.SearchOptions) != 0 {
		var searchSqlStr string
		for _, val := range opt.SearchOptions {
			searchSqlStr = fmt.Sprintf("AND %s %s ? ", val.Col, val.Condition)
			searchSqlVal = append(searchSqlVal, val.Val)
		}
		sqlStr = fmt.Sprintf("%s %s", sqlStr, searchSqlStr)
	}

	if opt.Order != nil && opt.OrderBy != nil {
		sqlStr = fmt.Sprintf("%s ORDER BY %s %s", sqlStr, *opt.OrderBy, *opt.Order)
	}

	if opt.Limit != nil && opt.Page != nil {
		offset := (*opt.Limit) * (*opt.Page)
		sqlStr = fmt.Sprintf("%s LIMIT %v, %v", sqlStr, offset, *opt.Limit)
	}

	return
}
