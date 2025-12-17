package dsdto

type DsUniqWithDatasetIDDto struct {
	DsUniqDto
	DatasetID string
}

type BatchCheckIndexStatusReq struct {
	DsUniqWithDatasetIDDtos []*DsUniqWithDatasetIDDto
	IsShowFailInfos         bool
}
