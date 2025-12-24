# 脚本只要发生错误，就终止执行
set -e

abspath=$(pwd)
source "$abspath/runtime/tools.sh"
[[ $BUILD_ARCH == "x86" ]] && arch=$amd64 || arch=$arm64
image="$imagename-$arch.$timedate"

# 拷贝文件
cp $abspath/package.json $abspath/runtime/
cp $abspath/yarn.lock $abspath/runtime/
cp $abspath/package-lock.json $abspath/runtime/

# 进入工作目录
cd $abspath/runtime/

# 打包
docker build \
--build-arg arch=$arch \
--build-arg nodeversion=$nodeversion \
--rm \
--pull \
-t $image \
-f ./buildImage.Dockerfile .

# push 镜像
docker push $image

# 清理操作
docker rmi -f $image
