#!/usr/bin/env python3
"""每秒打印一个递增计数，用于观察 cgroup.freeze / cgroup.kill。

用法:
    python3 tick.py [目标 cgroup 路径]

被 freeze 后计数会停住（进程还在，但拿不到 CPU）；
被 kill 后进程直接消失。这两个文件是 cgroup v2 里最直观的"整组操作"。
"""
import os
import sys
import time

CGROUP = sys.argv[1] if len(sys.argv) > 1 else None


def my_cgroup():
    # /proc/self/cgroup 的格式是 "0::/path"，第三段就是路径
    line = open("/proc/self/cgroup").read().strip()
    return "/sys/fs/cgroup" + line.split(":", 2)[2]


if CGROUP:
    try:
        with open(os.path.join(CGROUP, "cgroup.procs"), "w") as f:
            f.write(str(os.getpid()))
    except OSError as e:
        # 入组失败必须硬退出。否则进程会留在原 cgroup ——
        # 你以为它被限制了，其实它一点约束都没有。
        print(f"FATAL: 无法进入 {CGROUP}: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"self-moved into {my_cgroup()}", flush=True)

i = 0
while True:
    print(f"tick {i}", flush=True)
    i += 1
    time.sleep(1)
