#!/usr/bin/env python3
"""烧 CPU 的零依赖脚本，用于观察 cpu.max。

用法:
    python3 burn-cpu.py [秒数] [目标 cgroup 路径]

第二个参数不传就留在当前 cgroup。传了就先自我进组，再开始烧 ——
顺序很重要，见正文「写实验脚本时的三个坑」。
"""
import os
import sys
import time

SECONDS = float(sys.argv[1]) if len(sys.argv) > 1 else 12
CGROUP = sys.argv[2] if len(sys.argv) > 2 else None


def my_cgroup():
    # /proc/self/cgroup 的格式是 "0::/path"，第三段就是路径
    line = open("/proc/self/cgroup").read().strip()
    return "/sys/fs/cgroup" + line.split(":", 2)[2]


if CGROUP:
    try:
        with open(os.path.join(CGROUP, "cgroup.procs"), "w") as f:
            f.write(str(os.getpid()))
    except OSError as e:
        # 入组失败必须硬退出。否则进程留在原 cgroup，
        # 你以为它在受限组里，其实它一点约束都没有。
        print(f"FATAL: 无法进入 {CGROUP}: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"self-moved into {my_cgroup()}", flush=True)

end = time.time() + SECONDS
x = 0
while time.time() < end:
    x += 1
print(f"burned {SECONDS}s, x={x}", flush=True)
