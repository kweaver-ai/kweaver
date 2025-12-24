package database

import "github.com/go-sql-driver/mysql"

var (
	ErrDuplicateEntryCode = 1062
)

func MysqlErrCode(err error) int {
	mysqlErr, ok := err.(*mysql.MySQLError)
	if !ok {
		return 0
	}
	return int(mysqlErr.Number)
}
