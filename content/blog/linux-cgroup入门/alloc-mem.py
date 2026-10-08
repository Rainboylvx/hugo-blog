#!/usr/bin/env python3
"""在 cgroup 内分配内存，用于观察 memory.max / memory.high / memory.swap.max。

用法:
    python3 alloc-mem.py <总MB> [步长MB] [持有秒数] [目标 cgroup 路径]

两个细节:
  * 逐页触碰: bytearray(n) 只是向内核要虚拟地址, 必须真写一遍才会分配物理页。
  * 每步打印 memory.current, 这样能直接看到限制生效的时刻。
"""
import os
import sys
import time

TOTAL_MB = int(sys.argv[1])
STEP_MB = int(sys.argv[2]) if len(sys.argv) > 2 else TOTAL_MB
HOLD_S = float(sys.argv[3]) if len(sys.argv) > 3 else 0
CGROUP = sys.argv[4] if len(sys.argv) > 4 else None


def my_cgroup():
    line = open("/proc/self/cgroup").read().strip()
    return "/sys/fs/cgroup" + line.split(":", 2)[2]


if CGROUP:
    try:
        with open(os.path.join(CGROUP, "cgroup.procs"), "w") as f:
            f.write(str(os.getpid()))
    except OSError as e:
        print(f"FATAL: 无法进入 {CGROUP}: {e}", file=sys.stderr)
        sys.exit(1)
    print(f"self-moved into {my_cgroup()}", flush=True)

chunks = []
for done in range(0, TOTAL_MB, STEP_MB):
    n = min(STEP_MB, TOTAL_MB - done)
    buf = bytearray(n * 1024 * 1024)
    for i in range(0, len(buf), 4096):
        buf[i] = 1
    chunks.append(buf)
    try:
        cur = open(os.path.join(my_cgroup(), "memory.current")).read().strip()
    except OSError:
        cur = "?"
    print(f"touched {done + n} MB  memory.current={cur}", flush=True)

print(f"allocated total {TOTAL_MB} MB", flush=True)
if HOLD_S:
    time.sleep(HOLD_S)
