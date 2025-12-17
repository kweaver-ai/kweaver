package squaresvc

import (
	"context"

	"github.com/pkg/errors"
)

func (svc *squareSvc) IsSpaceExists(ctx context.Context, spaceID string) (exists bool, err error) {
	exists, err = svc.spaceRepo.ExistsByID(ctx, spaceID)
	if err != nil {
		err = errors.Wrapf(err, "[squareSvc.IsSpaceExists]:svc.spaceRepo.ExistsByID(ctx, %s)", spaceID)
		return
	}

	return
}
