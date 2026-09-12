#!/bin/bash

# 配置
LOCAL_BUILD_DIR="./public/"
REMOTE_USER="root"
REMOTE_HOST="bohai"
REMOTE_DIR="/www/wwwroot/blog.roj.ac.cn/"

echo "--- 1. 开始 Hugo 本地编译 ---"
hugo -D --minify
if [ $? -ne 0 ]; then
    echo "Hugo 构建失败，停止同步。"
    exit 1
fi

echo "--- 2. 开始增量同步到服务器 ---"
# .user.ini 由宝塔面板用 chattr +i 保护（内含 open_basedir），root 也无法 unlink；
# 它不属于站点构建产物，必须排除，否则 --delete 每次都会 EPERM 并触发 rsync 退出码 23。
rsync -avz --delete --exclude=.user.ini "$LOCAL_BUILD_DIR" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"

# rsync 退出码 23 = 有部分文件未成功同步。已知的 .user.ini 干扰已通过 --exclude 排除，
# 若仍出现 23，说明是真漏了文件：只提示，不再静默当作成功。
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo "--- 同步完成！---"
    exit 0
elif [ $EXIT_CODE -eq 23 ]; then
    echo "警告：rsync 退出码 23，有文件未同步（非 .user.ini 原因），请检查上面的错误输出。"
    exit 0
else
    echo "同步失败，错误码: $EXIT_CODE"
    exit 1
fi
