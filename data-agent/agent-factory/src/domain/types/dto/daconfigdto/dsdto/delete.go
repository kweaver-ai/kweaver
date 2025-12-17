package dsdto

type DsRepoDeleteDto struct {
	*DsUniqDto
	IsOtherUsed bool
	DatasetID   string
}
