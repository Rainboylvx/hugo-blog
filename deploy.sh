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
rsync -avz --delete "$LOCAL_BUILD_DIR" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"

# rsync 退出码 23 表示有部分文件未成功同步（通常是权限问题），视为同步成功
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 23 ]; then
    echo "--- 同步完成 (含警告或成功)！---"
    exit 0
else
    echo "同步失败，错误码: $EXIT_CODE"
    exit 1
fi
