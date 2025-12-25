#!/bin/bash

ccp::lib::version::get_version_vars() {
	GIT_COMMIT="$(git rev-parse HEAD 2>/dev/null)"

	if git_status="$(git status --porcelain 2>/dev/null)" && [[ -z "${git_status}" ]]; then
		GIT_TREE_STATE="clean"
	else
		GIT_TREE_STATE="dirty"
	fi

	GIT_VERSION="$(git describe --tags --match='v*' 2>/dev/null)"
        GIT_VERSION="V0.0.0"
	DASH_IN_VERSION="$(echo "${GIT_VERSION}" | sed "s/[^-]//g")"
	if [[ "${DASH_IN_VERSION}" == "---" ]]; then
		GIT_VERSION="$(echo "${GIT_VERSION}" | sed "s/-\([0-9]\{1,\}\)-g\([0-9a-f]\{7\}\)$/.\1+\2/")"
	fi
	if [[ "${GIT_TREE_STATE}" == "dirty" ]]; then
		GIT_VERSION+="-dirty"
	fi

	VERSION="${GIT_VERSION#v}"

	DOCKER_TAG="${DOCKER_TAG:-${GIT_VERSION#v}}"
	DOCKER_TAG="${DOCKER_TAG/+/_}"

	DOCKER_REGISTRY="${DOCKER_REGISTRY:-acr.aishu.cn}"
	DOCKER_REPOSITORY="${DOCKER_REPOSITORY:-as/deploy/tools}"
}

cpp::lib::version::go_ldflags() {
  LDFLAGS="-w -s"
  LDFLAGS+=" -X crate/version.gitCommit=${GIT_COMMIT}"
  LDFLAGS+=" -X crate/version.gitVersion=${GIT_VERSION}"
  LDFLAGS+=" -X crate/version.gitTreeState=${GIT_TREE_STATE}"
  LDFLAGS+=" -X crate/version.buildDate=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}

cpp::lib::version::env() {
  workDir=$(dirname $(dirname $(dirname $(dirname $(readlink -f $0)))))
  DOCKER_REGISTRY="${DOCKER_REGISTRY:-acr.aishu.cn}"
  DOCKER_REPOSITORY="${DOCKER_REPOSITORY:-as/deploy/tools}"
}


cpp::lib::version::env
#cd ${workDir}
#ccp::lib::version::get_version_vars
#cpp::lib::version::go_ldflags
