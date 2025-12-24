variable "VERSION" {
    default = "0.1.0-debug"
}

variable "TAG" {
    default = "debug.latest"
}

variable "DEVOPS_PAT" {}


target "mqsdk" {
    dockerfile = "docker/Dockerfile.mqsdk"
    target = "result"
    output = [ "result/mqsdk" ]
}

target "chart" {
    dockerfile = "docker/Dockerfile.chart"
    target = "result"
    output = [ "result/chart" ]
    args = {
        VERSION = "${VERSION}"
        TAG = "${TAG}"
    }
}


target "image" {
    dockerfile = "docker/Dockerfile.service"
    target = "result"
    tags = [
        "acr.aishu.cn/ict/business-system-backend:${TAG}"
    ]
    args = {
        DEVOPS_PAT = "${DEVOPS_PAT}"
    }
}

target "test" {
    dockerfile = "docker/Dockerfile.service"
    target = "tester"
    args = {
        DEVOPS_PAT = "${DEVOPS_PAT}"
    }
}

group "default" {
    targets = [ "image", "chart" ]
}