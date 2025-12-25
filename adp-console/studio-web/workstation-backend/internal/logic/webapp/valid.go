package webapp

import (
	_ "embed"
	"errors"
	"fmt"

	"github.com/xeipuuv/gojsonschema"
	"workstation-backend/internal/cerror"
)

//go:embed app-manifest.shema.jsonc
var manifestSchema string

func ValidManifest(m Manifest) error {
	schemaLoader := gojsonschema.NewStringLoader(manifestSchema)
	documentLoader := gojsonschema.NewGoLoader(m)
	result, err := gojsonschema.Validate(schemaLoader, documentLoader)
	if err != nil {
		return cerror.Warp(err, "schema validation error")
	}
	if !result.Valid() {
		var errs []error
		for _, desc := range result.Errors() {
			errs = append(errs, fmt.Errorf("%s", desc))
		}
		err := errors.Join(errs...)
		return cerror.Warp(err, "manifest validation error")
	}
	return nil
}

func ValidManifests(m []Manifest) error {
	errs := make([]error, 0)
	for _, manifest := range m {
		if err := ValidManifest(manifest); err != nil {
			errs = append(errs, err)
		}
	}
	if len(errs) > 0 {
		return errors.Join(errs...)
	}
	return nil
}
