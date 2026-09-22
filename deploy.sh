#!/bin/bash

# ── 语音播报 ────────────────────────────────────────────────────────────────
# 复用 family-info-platform 的 say.py：POST 到 n8n webhook → 小米 TTS → PVE 音响。
# 局域网不可达 / 没有 say.py / 播报失败，都只打印一行提示并继续，绝不影响发布。
#
# 可用环境变量覆盖：
#   PUSH_SAY_SCRIPT   指定 say.py 路径（默认按下面的候选列表查找）
#   PUSH_SAY_IP       用来做 1s 可达性探测的局域网 IP（默认取 SAY_WEBHOOK 的 host）
#   PUSH_SAY_MESSAGE  播报文案
#   SAY_WEBHOOK       n8n webhook 地址
PUSH_SAY_MESSAGE="${PUSH_SAY_MESSAGE:-主人,博客 部署完成}"

say_webhook_host() {
  local webhook host
  webhook="${SAY_WEBHOOK:-http://192.168.9.103:5678/webhook/say}"
  host="${webhook#*://}"
  host="${host%%/*}"
  host="${host##*@}"
  printf '%s\n' "${host%%:*}"
}

# 依次尝试：显式指定 → ~/mybin/say.py → 仓库里的实际位置
resolve_say_script() {
  local candidate
  for candidate in \
    "${PUSH_SAY_SCRIPT:-}" \
    "$HOME/mybin/say.py" \
    "$HOME/mycode/服务器部署/family-info-platform/scripts/say.py"; do
    if [[ -n "$candidate" && -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

announce() {
  local message="$1"
  local say_ip say_script
  say_ip="${PUSH_SAY_IP:-$(say_webhook_host)}"

  if ! command -v ping >/dev/null 2>&1; then
    echo "[deploy] 未找到 ping，跳过语音通知" >&2
    return 0
  fi
  if ! ping -c 1 -W 1 "$say_ip" >/dev/null 2>&1; then
    echo "[deploy] 局域网 IP ${say_ip} 在 1s 内不可达，跳过语音通知" >&2
    return 0
  fi
  if ! command -v python3 >/dev/null 2>&1 || ! say_script="$(resolve_say_script)"; then
    echo "[deploy] 找不到 say.py（\$PUSH_SAY_SCRIPT / ~/mybin/say.py / family-info-platform），跳过语音通知" >&2
    return 0
  fi
  if ! python3 "$say_script" "$message"; then
    echo "[deploy] 语音通知失败，但不影响发布结果" >&2
  fi
}

# 配置
LOCAL_BUILD_DIR="./public/"
REMOTE_USER="root"
REMOTE_HOST="bohai"
REMOTE_DIR="/www/wwwroot/blog.roj.ac.cn/"

echo "--- 1. 开始 Hugo 本地编译 ---"
hugo -F -D --minify
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
    announce "$PUSH_SAY_MESSAGE"
    exit 0
elif [ $EXIT_CODE -eq 23 ]; then
    echo "警告：rsync 退出码 23，有文件未同步（非 .user.ini 原因），请检查上面的错误输出。"
    announce "$PUSH_SAY_MESSAGE"
    exit 0
else
    echo "同步失败，错误码: $EXIT_CODE"
    exit 1
fi
