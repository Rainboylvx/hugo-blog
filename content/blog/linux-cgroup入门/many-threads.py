#!/usr/bin/env python3
"""起若干线程并挂住，用于对比 cgroup.procs 与 cgroup.threads 的差异。

用法:
    python3 many-threads.py [线程数] [持有秒数] [目标 cgroup 路径]
"""
import os
import sys
import threading
import time

N = int(sys.argv[1]) if len(sys.argv) > 1 else 3
HOLD = float(sys.argv[2]) if len(sys.argv) > 2 else 300
CGROUP = sys.argv[3] if len(sys.argv) > 3 else None


def my_cgroup():
    line = open("/proc/self/cgroup").read().strip()
    return "/sys/fs/cgroup" + line.split(":", 2)[2]


def worker():
    while True:
        time.sleep(1)


if CGROUP:
    try:
        with open(os.path.join(CGROUP, "cgroup.procs"), "w") as f:
            f.write(str(os.getpid()))
    except OSError as e:
        print(f"FATAL: 无法进入 {CGROUP}: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"self-moved into {my_cgroup()}", flush=True)

for _ in range(N):
    threading.Thread(target=worker, daemon=True).start()

print(f"pid={os.getpid()} threads={threading.active_count()}", flush=True)
time.sleep(HOLD)
