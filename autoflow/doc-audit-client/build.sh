#!/bin/bash
#date:20190801
#explain:监控vue源文件，并编译
#by:fchd

CHECKDIR="/home/plateform-preview/src/views"    #监控目录路径
STATUS_URL="http://192.168.1.168/dev-plateform-web/customForm/status/compile"
function CheckDir {
    inotifywait -mrq --timefmt '%y-%m-%d %H:%M'  --format '%T %w%f %e' -e 'create,delete,close_write' $CHECKDIR|while read event
    do
        INO_TIME=$(echo $event | awk '{print $1,$2}')        # 把inotify输出切割 把时间部分赋值给INO_TIME
        INO_FILE=$(echo $event | awk '{print $3}')          # 把inotify输出切割 把文件路径部分赋值给INO_FILE
        INO_EVENT=$(echo $event | awk '{print $4}')         # 把inotify输出切割 把事件类型部分赋值给INO_EVENT
        INO_EXT=${INO_FILE##*.}
        if [[ "$INO_FILE" =~ .*vue$ ]]; then
            INO_DIR=`dirname $INO_FILE`
            FILE_NAME=`basename $INO_FILE .vue`
            ARR_DIRS=(${INO_DIR//// })
            LENGTH=${#ARR_DIRS[*]}
            APP_ID=${ARR_DIRS[$LENGTH-1]}
            if [[ $INO_EVENT = 'DELETE' ]] && [[ $INO_FILE != .* ]];then
              echo "`date '+%Y-%m-%d %H:%M'` delete file: $INO_FILE"
            else
              echo "`date '+%Y-%m-%d %H:%M'` modify file: $INO_FILE"
              build_dependency $FILE_NAME $APP_ID
              npx vue-cli-service build --target lib --formats umd-min --no-clean --dest /home/plateform-crud/static/$APP_ID --name "$FILE_NAME" $INO_FILE
              curl -X PUT "$STATUS_URL/$APP_ID/$FILE_NAME"
            fi
        fi
    done
}

function compile () {
  echo "compile dependency! $1"
  name=$1
  code=${name%.*}
  echo "code：$code"
  npx vue-cli-service build --target lib --formats umd-min --no-clean --dest /home/plateform-crud/static/$2 --name "$code" /home/plateform-preview/src/views/$2/$1 >> /home/rzdata-static/log/dev/pc/$2.txt
  curl -X PUT "$STATUS_URL/$2/$code"
}

function build_dependency() {
  files=`grep -r $1'.vue' ./src/views/$2 | awk '{print $1}'`
  echo $files
  for i in $files;
  do
    n1=${i%:*}
    n2=${n1##*/}
    compile $n2 $2
  done
}

CheckDir
