package cerror

import (
	"errors"
	"fmt"
)

var (
	ErrLockFailed      error = New("lock failed")
	ErrOperationFailed error = New("operation failed")
	ErrRecordNotFound  error = New("record not found")
)

func New(errstr string) error {
	return errors.New(errstr)
}

func Warp(err error, msg string) error {
	if err == nil {
		return errors.New(msg)
	}
	return fmt.Errorf("%s: %w", msg, err)
}
