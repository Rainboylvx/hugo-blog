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

if [ $? -eq 0 ]; then
    echo "--- 同步完成！---"
else
    echo "同步失败，请检查 SSH 连接。"
    exit 1
fi
