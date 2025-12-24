package initial

import (
	"os"
	"system-backend/internal/model"
	"system-backend/internal/pkg/authorization"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func InitAuthorization(auth *authorization.Authorization, log *logrus.Entry) error {
	// TODO: remove this line
	auth.SetPublicToken(os.Getenv("TMP_TOKEN"))
	return auth.RegisterBDType()
}

// TODO: develop work only
func InitTable(db *gorm.DB) error {
	return db.AutoMigrate(
		&model.BusinessDomain{},
		&model.BDProductR{},
		&model.BDResourceR{},
	)
}
