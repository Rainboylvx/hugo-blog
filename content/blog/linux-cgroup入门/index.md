---
title: "Linux cgroup 入门：从 mkdir 到看懂 docker --memory"
date: 2026-10-08
draft: false
toc: true
tags: ["Linux", "cgroup", "容器", "systemd"]
categories: []
---

你给容器设过 `--memory=128m` 吗？设完之后，这个数字到底被写到了哪里？为什么有时候容器明明超了内存却活得好好的，有时候又被直接杀掉？

答案在 `/sys/fs/cgroup` 这棵目录树里。这篇文章不先讲定义，我们直接建一个目录开始。

> [!WARNING] 以下命令均需 root
> cgroup 文件系统由 root 拥有，普通用户连 `mkdir /sys/fs/cgroup/xxx` 都会失败。下面所有命令都请用 root 执行（`sudo -i` 之后直接跑，或每条命令前加 `sudo`）。注意重定向不会继承 `sudo`，需要 root 写文件时用 `sudo tee`。
>
> 本文所有实验都在 Debian 13 / kernel 6.12.73 / systemd 257 / 纯 cgroup v2 的机器上真实跑过，输出是逐字粘贴的。

## 先建一个目录

```bash
mkdir /sys/fs/cgroup/demo
ls /sys/fs/cgroup/demo | head -20
```

```text
cgroup.controllers
cgroup.events
cgroup.freeze
cgroup.kill
cgroup.max.depth
cgroup.max.descendants
cgroup.pressure
cgroup.procs
cgroup.stat
cgroup.subtree_control
cgroup.threads
cgroup.type
cpu.idle
cpu.max
cpu.max.burst
cpu.pressure
cpuset.cpus
...
```

就这么多。**你刚刚创建了一个 cgroup**。

没有 `cgcreate`，没有配置文件，没有守护进程。`mkdir` 就是创建 cgroup 的全部仪式——因为 cgroup 在 Linux 里就是**一个用文件系统表示的进程分组**：目录代表组，目录里的文件代表这个组的属性和统计数据。

```bash
rmdir /sys/fs/cgroup/demo
```

`rmdir` 就是删除。这个设计贯穿全文：**cgroup 的所有操作都是对文件的读写**。

## 先搞清楚你在哪一边

cgroup 有两个不兼容的大版本，几乎所有新手困惑都源于搞混了它们。判断方法只有一条：

```bash
stat -fc %T /sys/fs/cgroup
```

```text
cgroup2fs
```

`cgroup2fs` 就是 cgroup v2。如果输出是 `tmpfs`，那 `/sys/fs/cgroup` 下面还会有 `memory/`、`cpu/`、`cpuacct/` 这样一堆并列的目录，那是 v1。

| | cgroup v1 | cgroup v2 |
|---|---|---|
| 时间 | 2.6.24 (2008) | 4.5 (2016)，5.0 后被发行版广泛采用 |
| 挂载点 | 每个 controller 一个挂载点 | **统一一棵树**，全部 controller 挂在 `/sys/fs/cgroup` |
| 进程归属 | 一个进程可以同时属于多个 controller 的不同组 | 一个进程在树里**只有一个位置** |
| `/proc/self/cgroup` | 多行，每行一个 hierarchy | **一行** `0::/path` |
| 目录里的文件 | `tasks` | `cgroup.procs` / `cgroup.threads` |

v1 那套「每个 controller 一棵独立树」的设计在实践中出了一堆问题：同一个进程在不同树里的位置互相矛盾，没法给一个组统一设限，还催生了各种 controller 间的耦合 hack。v2 的核心决定是**统一层级**：整个系统只有一棵 cgroup 树，所有 controller 都挂在这一棵树上。

本文只讲 v2。你在这台机器上看到的：

```bash
cat /sys/fs/cgroup/cgroup.controllers
```

```text
cpuset cpu io memory hugetlb pids rdma misc
```

这就是这棵树支持的全部 controller——`cpu` 管 CPU、`memory` 管内存、`pids` 管进程数、`io` 管块设备 IO，等等。

## cgroup 不是 namespace

这两个词经常一起出现，但管的是完全不同的两件事：

| | namespace | cgroup |
|---|---|---|
| 管什么 | 进程**看得见**什么 | 进程**能用多少** |
| 例子 | PID、网络、挂载点、主机名、用户 | CPU 时间、内存、进程数、磁盘 IO |
| 典型问题 | 「容器里 `ps` 为什么看不到宿主机的进程？」 | 「这个容器最多能用几个核？」 |
| 内核接口 | `unshare` / `clone` | 文件系统读写 |

打个比方：namespace 是给进程发了一张**门禁卡**（哪些房间进得去），cgroup 是给进程发了一张**饭卡**（每天能吃多少）。docker 的隔离感主要来自 namespace，docker 的资源限制全部来自 cgroup。

一个进程可以既有独立的 PID namespace，又被放在 cgroup 的某个角落——两者互不干涉。

## 实验 1：看这棵树

```bash
cat /proc/self/cgroup
```

```text
0::/user.slice/user-1000.slice/session-7372.scope
```

你现在这个 shell 就待在 `/user.slice/user-1000.slice/session-7372.scope` 这个 cgroup 里。`0::` 是 v2 的格式（`0` 是 hierarchy id，v2 永远是 0；中间空的是 controller 列表，v2 不需要）。

看整棵树的形状：

```bash
systemd-cgls --no-pager | head -30
```

```text
CGroup /:
-.slice
├─user.slice
│ └─user-1000.slice
│   ├─session-7372.scope
│   │ ├─2183140 sshd-session: rainboy [priv]
│   │ ├─2183152 sshd-session: rainboy@notty
│   │ ├─2183156 bash -s
│   │ └─2183179 systemd-cgls --no-pager
│   ├─user@1000.service …
│   │ ├─session.slice
│   │ │ ├─xdg-permission-store.service
│   │ │ ├─pipewire-pulse.service
│   │ │ ├─plasma-kwin_wayland.service
```

这就是 systemd 建立的 cgroup 树。`.slice` 是内部节点（只用来分组），`.scope` 和 `.service` 是叶子（里面装进程）。systemd 用 cgroup 把系统上每个服务、每个登录会话都归了档。

根 cgroup 里住了多少进程？

```bash
wc -l < /sys/fs/cgroup/cgroup.procs
```

```text
196
```

根 cgroup 是个例外——它允许直接装进程（原因在实验 3 讲）。

顺带看一眼 docker 容器落在哪：

```bash
docker run -d --name probe --entrypoint /bin/sh alpine -c 'sleep 300'
PID=$(docker inspect --format '{{.State.Pid}}' probe)
cat /proc/$PID/cgroup
docker rm -f probe
```

```text
0::/system.slice/docker-f6822dcadc1c4a727e393a9e97c040dd59dc03188007f6a316d5237682abcdea.scope
```

docker 给每个容器在 `system.slice` 下建一个以容器 ID 命名的 scope。**记住这个路径**，实验 7 还会回来。

> [!NOTE] 数值随机器/内核变化
> 会话名、PID、进程数都会因机器而异。要看的是**结构**，不是具体数字。

## 实验 2：把进程放进组里

先建一个组，再建一个子组：

```bash
mkdir -p /sys/fs/cgroup/cglab /sys/fs/cgroup/cglab/exp
echo "+cpu +memory +pids" > /sys/fs/cgroup/cglab/cgroup.subtree_control
```

新建的组默认继承父组可用的全部 controller：

```bash
cat /sys/fs/cgroup/cglab/exp/cgroup.controllers
```

```text
cpu memory pids
```

然后是核心操作——**把进程放进 cgroup，就是往它的 `cgroup.procs` 写 PID**。先看要用到的脚本：

{{< include "many-threads.py" "python" >}}

这个脚本先把自己写进目标组（第二个参数之后的路径），再起 3 个工作线程：

```bash
python3 many-threads.py 3 600 /sys/fs/cgroup/cglab/exp &
```

```text
self-moved into /sys/fs/cgroup/cglab/exp
pid=49830 threads=4
```

`self-moved into ...` 这行就是脚本的自我确认：它真的进去了。

现在来看这个组里的进程：

```bash
cat /sys/fs/cgroup/cglab/exp/cgroup.procs
```

```text
49830
```

只有一行。但这个 python 进程其实有 4 个线程：

```bash
cat /proc/49830/task
```

```text
49830
49832
49833
49834
```

再读 `cgroup.threads`：

```bash
cat /sys/fs/cgroup/cglab/exp/cgroup.threads
```

```text
49830
49832
49833
49834
```

```text
行数: procs=1  threads=4
```

**`cgroup.procs` 是进程视图，`cgroup.threads` 是线程视图。**

- 写 `cgroup.procs` 写的是 PID（线程组组长），**整个线程组一起搬过去**；
- 写 `cgroup.threads` 写的是 TID，可以只搬一个线程——这是 v2 才有的能力，用于把同一个进程的线程放进不同的组（后面实验 3 会看到它和 `cgroup.type` 的联动）。

99% 的场景你用 `cgroup.procs` 就够了。

> [!NOTE] 数值随机器/内核变化
> PID 和线程数取决于你的机器。

## 实验 3：no internal process

这是 cgroup v2 最容易撞墙的一条规则，也是理解整棵树的钥匙。

### 3.1 现象：往有进程的组里启用 memory，报 EBUSY

刚才那个 python 进程还在组里。现在试着给**它所在的组**启用 memory controller：

```bash
echo "+memory" > /sys/fs/cgroup/cglab/exp/cgroup.subtree_control
```

```text
bash: 第 46 行：echo: 写入错误：设备或资源忙
```

`EBUSY`。而 `cgroup.subtree_control` 没变：

```bash
cat /sys/fs/cgroup/cglab/exp/cgroup.subtree_control
```

```text
（空）
```

但换成 cpu 就成功了：

```bash
echo "+cpu" > /sys/fs/cgroup/cglab/exp/cgroup.subtree_control
cat /sys/fs/cgroup/cglab/exp/cgroup.subtree_control
cat /sys/fs/cgroup/cglab/exp/cgroup.type
```

```text
cpu
domain threaded
```

同样的组、同样的进程，`+memory` 被拒，`+cpu` 通过。**这不是随机的，cgroup v2 的 controller 分两类。**

### 3.2 规则本身

官方文档（[cgroup-v2.rst](https://docs.kernel.org/admin-guide/cgroup-v2.html)）的原话：

> Non-root cgroups can distribute domain resources to their children only when they don't have any processes of their own. In other words, only domain cgroups which don't contain any processes can have domain controllers enabled in their "cgroup.subtree_control" files.
>
> This guarantees that, when a domain controller is looking at the part of the hierarchy which has it enabled, processes are always only on the leaves.

翻译成人话：

> **一个组要么「自己装进程」，要么「把资源分配给子组」，不能两件事都做。**

为什么？因为如果父组既自己跑着进程、又给子组分配了资源，那**父组的进程和子组的进程就在抢同一份资源**——内核的分配模型就没法自洽了。v2 用一条硬规则把这种情况消灭掉：只要启用了 domain controller，进程就只能待在叶子节点上。

两个重要补充：

1. **根 cgroup 豁免**。这就是为什么 `/sys/fs/cgroup/cgroup.procs` 里有 196 个进程，而根组的 `cgroup.subtree_control` 却能启用全部 8 个 controller。根组里有大量无法归属到其他组的进程和匿名资源消耗，只能特殊对待。
2. **规则是双向的**。组一旦把 domain controller 下放（`subtree_control` 非空），它自己也**不能再直接接收新进程**：

```bash
echo $$ > /sys/fs/cgroup/cglab/exp/cgroup.procs
```

```text
bash: 写入错误：设备或资源忙
```

这条比 3.1 更容易踩坑，见文末「写实验脚本时的三个坑」。

### 3.3 例外：threaded controller

回到 3.1 的谜题。为什么 `+cpu` 能成功？

因为 **`cpu`、`cpuset`、`pids` 属于 threaded controller，`memory`、`io`、`hugetlb`、`rdma`、`misc` 属于 domain controller**。no-internal-process 规则**只约束 domain controller**。

官方文档对两类 controller 的定义：

> Controllers which support thread mode are called threaded controllers. The ones which don't are called domain controllers.
>
> Currently, the following controllers are threaded and can be enabled in a threaded cgroup:
> - cpu
> - cpuset
> - perf_event
> - pids

把 8 个 controller 全部实测一遍（每组新建、组内含 1 个进程）：

```bash
for c in cpuset cpu io memory hugetlb pids rdma misc; do
  d=/sys/fs/cgroup/cgmx/t_$c; mkdir -p $d
  sleep 300 & TP=$!
  echo $TP > $d/cgroup.procs
  if echo "+$c" > $d/cgroup.subtree_control 2>/dev/null; then
    printf "  +%-8s 成功   type=%s\n" "$c" "$(cat $d/cgroup.type)"
  else
    printf "  +%-8s 失败   type=%s\n" "$c" "$(cat $d/cgroup.type)"
  fi
  kill -9 $TP; rmdir $d
done
```

```text
  +cpuset   成功   type=domain threaded
  +cpu      成功   type=domain threaded
  +io       失败   type=domain
  +memory   失败   type=domain
  +hugetlb  失败   type=domain
  +pids     成功   type=domain threaded
  +rdma     失败   type=domain
  +misc     失败   type=domain
```

边界干净利落：**cpu / cpuset / pids 通过，io / memory / hugetlb / rdma / misc 报 EBUSY**。

作为对照，同样的 8 个 controller 在一个**空组**上全部成功：

```text
  cpuset    成功
  cpu       成功
  io        成功
  memory    成功
  hugetlb   成功
  pids      成功
  rdma      成功
  misc      成功
```

所以失败的原因从来不是「这个 controller 有问题」，而是**组里有进程**。

### 3.4 cgroup.type 的四种取值

上面 `cgroup.type` 一直在变，它记录了这个组的形态：

| 值 | 含义 |
|---|---|
| `domain` | 正常的 domain 组，可以装进程，也可以启用 domain controller |
| `domain threaded` | 它是有进程的 domain 组，同时作为 threaded 子树的根 |
| `domain invalid` | 无效状态，既不能装进程也不能启用 controller，只能转成 threaded |
| `threaded` | threaded 子树里的成员组 |

官方文档对 `domain threaded` 的触发条件写得很直白：

> A domain cgroup is turned into a threaded domain when one of its child cgroup becomes threaded or threaded controllers are enabled in the "cgroup.subtree_control" file while there are processes in the cgroup. A threaded domain reverts to a normal domain when the conditions clear.

也就是说：**有进程的组一旦启用 threaded controller，就会变成 `domain threaded`**——正好是 3.1 里发生的事。把 controller 撤掉，它就退回 `domain`：

```bash
echo "-cpu" > /sys/fs/cgroup/cglab/exp/cgroup.subtree_control
cat /sys/fs/cgroup/cglab/exp/cgroup.type
```

```text
domain
```

### 3.5 正确姿势：先挪进程，再启用

既然规则是「有进程就不能启用 domain controller」，那标准流程就是三步：

```bash
# 1) 先放进程到父组（此刻父组还没启用任何 controller）
mkdir /sys/fs/cgroup/cglab2
sleep 600 & P1=$!
echo $P1 > /sys/fs/cgroup/cglab2/cgroup.procs

# 2) 建子组
mkdir /sys/fs/cgroup/cglab2/leaf

# 3) 把父组的进程全部挪进子组
for p in $(cat /sys/fs/cgroup/cglab2/cgroup.procs); do
  echo $p > /sys/fs/cgroup/cglab2/leaf/cgroup.procs
done
```

```text
1) 父组已有进程      = [50029]
2) 建了子组 cglab2/leaf (此刻它没有 memory.max: 0 个)
3) 挪完之后 父组进程 = []  (空)
            叶子进程 = [50029]
```

父组空了，现在启用 domain controller 就成功了：

```bash
echo "+memory +pids" > /sys/fs/cgroup/cglab2/cgroup.subtree_control
```

```text
4) cgroup.subtree_control = [memory pids]
5) 叶子组现在出现: memory.max pids.max
   memory.max 默认值 = max
```

**注意第 5 行的关键细节**：启用之前，子组里**根本没有 `memory.max` 这个文件**。controller 是从父组「下放」到子组的——父组不启用，子组就没有对应的文件可写。这是新手第二个常见困惑（「为什么 `echo 1G > memory.max` 报权限不够」），文末排错表里有对应的 errno 对照。

> [!NOTE] 数值随机器/内核变化
> PID 会变。要看的是「父组进程变空 → 启用成功 → 子组出现新文件」这个因果链。

## 实验 4：cpu.max 限 CPU

现在组建好了，可以真正开始限制了。

{{< include "burn-cpu.py" "python" >}}

先测基线——4 个 busy loop，不设限制：

```bash
S=/sys/fs/cgroup/cglab/exp
B=$(awk '/^usage_usec/{print $2}' $S/cpu.stat); T0=$(date +%s%N)
for i in 1 2 3 4; do python3 burn-cpu.py 12 $S >/dev/null 2>&1 & done
wait
A=$(awk '/^usage_usec/{print $2}' $S/cpu.stat); T1=$(date +%s%N)
echo "实测占用 = $(echo "scale=3; ($A-$B)/(($T1-$T0)/1000)" | bc) 核"
cat $S/cpu.stat
```

```text
实测占用 = 3.990 核
usage_usec 48018485
user_usec 48010484
system_usec 8000
nice_usec 0
nr_periods 0
nr_throttled 0
throttled_usec 0
nr_bursts 0
burst_usec 0
```

4 个 busy loop 吃掉 3.99 核（12 核机器），符合预期。`cpu.stat` 里的 `usage_usec` 是这个组累计消耗的 CPU 时间（微秒），是所有 CPU 核算法的数据源。

现在设 `cpu.max`：

```bash
echo "200000 1000000" > $S/cpu.max
```

`cpu.max` 的格式是 `<配额> <周期>`，单位都是微秒。`200000 1000000` = 每个 1000ms 周期内最多用 200ms = **0.2 核**。

重跑同样的测试：

```bash
实测占用 = 0.202 核
cpu.max          = 200000 1000000
usage_usec 50639869
user_usec 50631868
system_usec 8000
nice_usec 0
nr_periods 13
nr_throttled 13
throttled_usec 48857885
nr_bursts 0
burst_usec 0
```

**3.99 核 → 0.202 核**，与设定的 0.2 核几乎完全一致。

限流的证据藏在 `cpu.stat` 里：

- `nr_periods 13` —— 这 12 秒里经历了 13 个周期
- `nr_throttled 13` —— **13 个周期全部被限流**（100%）
- `throttled_usec 48857885` —— 累计被强制停跑了 48.9 秒（4 个进程合计）

基线那组这三个值全是 0，因为没有配额就谈不上「超配额」。

压力指标也跟着变了：

```bash
cat $S/cpu.pressure
```

```text
some avg10=64.44 avg60=16.45 avg300=3.65 total=12034179
full avg10=64.44 avg60=16.45 avg300=3.65 total=12034179
```

这是 PSI（Pressure Stall Information）。`some` 表示「至少有一个进程在等 CPU 的时间占比」，`avg10=64.44` 意味着最近 10 秒里有 64% 的时间至少有一个进程因为 CPU 不够而卡住。基线那组的 `cpu.pressure` 三个 avg 全是 `0.00`（`total` 只有几百微秒的噪声）——不设限时进程几乎从不等待。

`cpu.max` 是**硬限**。还有一个 `cpu.weight`（默认 100，对应 `cpu.weight.nice=0`），它是**相对权重**——只在多个组争抢时决定分配比例，不设上限。前者管「最多多少」，后者管「抢的时候分多少」。

> [!NOTE] 数值随机器/内核变化
> 占用核数取决于你的 `nproc` 和实际负载。`0.2 核`这个上限是 `cpu.max` 直接算出来的，不受机器影响。

## 实验 5：memory.max 与 OOM

内存这块有个大坑，我们分三步踩。

### 5.1 设了 memory.max，进程却没死

{{< include "alloc-mem.py" "python" >}}

```bash
S=/sys/fs/cgroup/cglab/exp
echo 100M > $S/memory.max
cat $S/memory.max
cat $S/memory.swap.max
```

```text
104857600
max
```

限制 100M，swap 上限是 `max`（不限）。现在在组内分配 300M，**并让进程活着**，这样才能采样到真实值：

```bash
python3 alloc-mem.py 300 300 15 $S &
sleep 6
cat $S/memory.current
cat $S/memory.swap.current
cat $S/memory.events
```

```text
self-moved into /sys/fs/cgroup/f1/exp
touched 300 MB  memory.current=104599552
allocated total 300 MB

[存活时采样]
  memory.current      = 104591360   (99 MiB)
  memory.swap.current = 210841600   (201 MiB)   <- 多出来的都在 swap 里
  memory.peak         = 104857600
  memory.events       = low 0 high 0 max 2425 oom 0 oom_kill 0 oom_group_kill 0
退出码=0
```

**分配了 300M，限制是 100M，进程却正常退出了。**

账很好算：`memory.current` 99MiB + `memory.swap.current` 201MiB ≈ 300MiB。**超出的 200M 全被换出到 swap 了。**

`memory.peak` 恰好卡在 `104857600` = 100MiB，说明它从未真正突破限制。事件计数里 `max 2425` 表示撞上限 2425 次，但 **`oom_kill 0`：一次都没杀**。

再看 `memory.stat`：

```bash
cat $S/memory.stat | grep -E "^(anon|pgmajfault|swapcached)"
```

```text
anon 103964672
pgmajfault 9604
swapcached 4096
```

`pgmajfault 9604`——主缺页 9604 次，即进程访问数据时被从 swap 换回来了 9604 次。宿主机侧看得很清楚：

```text
宿主机 swap used = 203 MB
```

**结论：`memory.max` 是硬限，但「超过硬限」不等于「被 OOM」。内核先尝试回收——包括把匿名页写进 swap。只有回收也解决不了时才杀进程。**

> [!WARNING] 采样时机很关键
> 如果在**进程退出后**才读 `memory.swap.current`，会得到几百 KB 的假象——因为进程一死内存就全释放了。必须在进程**活着的时候**采样。我第一次跑这个实验就搞错了，看到 `swap.current` 只有 100KB，误以为「没用 swap」。

### 5.2 关掉 swap，才看到真 OOM

把 swap 上限设成 0，让回收无路可走：

```bash
echo 0 > $S/memory.swap.max
python3 alloc-mem.py 300 300 0 $S
echo "退出码=$?"
```

```text
self-moved into /sys/fs/cgroup/f1/exp
退出码=137
```

**137 = 128 + 9，被 SIGKILL 杀掉了。** 连 `allocated total 300 MB` 都没来得及打印。

事件计数：

```bash
cat $S/memory.events
```

```text
low 0
high 0
max 2460
oom 1
oom_kill 1
oom_group_kill 0
```

`oom_kill` 从 0 变成 1。内核日志里有完整记录：

```bash
dmesg | grep -E "Killed process|oom-kill:" | tail -2
```

```text
oom-kill:constraint=CONSTRAINT_MEMCG,nodemask=(null),cpuset=f1,mems_allowed=0,oom_memcg=/f1/exp,task_memcg=/f1/exp,task=python3,pid=120868,uid=0
Memory cgroup out of memory: Killed process 120868 (python3) total-vm:324668kB, anon-rss:105136kB, file-rss:6392kB, shmem-rss:0kB, UID:0 pgtables:280kB oom_score_adj:0
```

读这两行：

- `constraint=CONSTRAINT_MEMCG` —— 触发的是 **cgroup 内存限制**，不是整机内存不足
- `oom_memcg=/f1/exp` `task_memcg=/f1/exp` —— 受害者所属的 cgroup，正是我们建的那个
- `anon-rss:105136kB` —— 被杀时匿名页约 103MiB，卡在 100MiB 限制附近

**这就是「容器被 OOM Killed」的真实样子。** 排查容器被杀时，`docker inspect` 里的 `OOMKilled: true` 就是这个事件的回执。

### 5.3 memory.high：只限流，不杀

除了硬限 `memory.max`，还有软限 `memory.high`。超过它不会杀进程，只会**限流 + 积极回收**：

```bash
echo max > $S/memory.swap.max
echo max > $S/memory.max
echo 50M > $S/memory.high
python3 alloc-mem.py 200 20 12 $S &
```

逐秒采样：

```text
t= 1s current=  50327552 high_cnt=63 oom_kill=1 alive=yes
t= 2s current=  50327552 high_cnt=63 oom_kill=1 alive=yes
t= 3s current=  50327552 high_cnt=63 oom_kill=1 alive=yes
...
t=11s current=  50327552 high_cnt=63 oom_kill=1 alive=yes
t=12s current=     12288 high_cnt=63 oom_kill=1 alive=no
退出码=0   <- 0 = 进程活着
```

`memory.high=50M`（52428800），`memory.current` 被稳稳压在 `50327552`（≈48MiB）——**低于 high 值**，因为内核提前开始回收。`high` 计数涨到 63，`oom_kill` 始终是 1（没新增）。进程正常退出，退出码 0。

三个内存参数的定位：

| 文件 | 性质 | 超了会怎样 |
|---|---|---|
| `memory.high` | 软限 | 限流 + 积极回收，进程变慢但活着 |
| `memory.max` | 硬限 | 先回收（含 swap），回收不动才 OOM kill |
| `memory.swap.max` | swap 上限 | 决定回收时能不能用 swap 兜底 |

### 5.4 那为什么容器会被 OOM？

留个悬念：裸 cgroup 的 `memory.swap.max` 默认是 `max`，所以上面 5.1 里进程活得好好的。容器会是这样吗？实验 7 揭晓（剧透：容器把 swap 也锁死了，所以更容易被杀）。

> [!NOTE] 数值随机器/内核变化
> 是否有 swap、swap 多大、内核回收策略都会影响具体数值。**要记住的是因果**：有 swap 兜底 → 回收成功 → 不 OOM；swap 也堵死 → 才 OOM kill。

## 实验 6：cgroup.freeze 与 cgroup.kill

前面几个实验都是「读写参数」。cgroup v2 还有两个**直接作用于整组进程**的操作。

{{< include "tick.py" "python" >}}

先跑一个每秒打印计数的进程：

```bash
S=/sys/fs/cgroup/cglab/exp
python3 tick.py $S > /tmp/tick.out 2>&1 &
TP=$!
sleep 3
wc -l < /tmp/tick.out
```

```text
4
```

3 秒产生 4 行。现在**冻结整个组**：

```bash
echo 1 > $S/cgroup.freeze
cat $S/cgroup.freeze
cat $S/cgroup.events
```

```text
1
populated 1 frozen 1
```

等 5 秒，看输出有没有增长：

```text
冻结期间 5 秒新增行数 = 0   <- 0 = 冻结成功
进程是否存活          = yes   <- yes = 只是拿不到 CPU
```

**5 秒 0 行新增，但进程还在。** `cgroup.freeze` 让组里所有进程停止被调度——它们不消耗 CPU，但内存、文件描述符、状态全部保留。这比 `SIGSTOP` 更好用，因为它是**整组生效**的，不需要遍历 PID。

解冻：

```bash
echo 0 > $S/cgroup.freeze
sleep 3
wc -l < /tmp/tick.out
```

```text
解冻后行数 = 8   <- 继续增长
```

进程从断点继续跑。

再来 `cgroup.kill`——v2 新增的「一键杀整组」：

```bash
cat $S/cgroup.procs
echo 1 > $S/cgroup.kill
sleep 1
cat $S/cgroup.procs
```

```text
kill 前组内进程 = [53082]
kill 后组内进程 = []
进程是否存活    = no
```

一行写入，组里所有进程全灭。在 v1 时代这需要遍历 PID 逐个 `kill`，还得处理「杀的过程中又有 fork」的竞态；`cgroup.kill` 在内核里原子完成。

> [!NOTE] 数值随机器/内核变化
> tick 行数取决于你的时序。看的是「冻结期间不增长、解冻后恢复」这个行为。

## 实验 7：systemd 和 docker 在背后做了什么

现在把前面所有东西连起来。

### systemd

```bash
systemd-run --unit=cglab-svc --scope -p MemoryMax=100M -p CPUQuota=50% sleep 300
CGP=$(systemctl show -p ControlGroup --value cglab-svc.scope)
echo $CGP
cat /sys/fs/cgroup$CGP/memory.max
cat /sys/fs/cgroup$CGP/cpu.max
cat /sys/fs/cgroup$CGP/memory.high
```

```text
/system.slice/cglab-svc.scope
104857600
50000 100000
max
```

`MemoryMax=100M` 被翻译成 `memory.max = 104857600`（精确 100MiB），`CPUQuota=50%` 被翻译成 `cpu.max = 50000 100000`（50ms/100ms = 0.5 核）。

注意 `memory.high = max`——**systemd 的 `MemoryMax` 只写 `memory.max`，不碰 `memory.high`**。想用软限得显式写 `MemoryHigh=`。

停止服务：

```bash
systemctl stop cglab-svc.scope
ls -d /sys/fs/cgroup$CGP
```

```text
ls: 无法访问 '.../cglab-svc.scope': 没有那个文件或目录
```

**cgroup 目录自动消失了。** systemd 不只是写参数，它还负责这棵树的创建和回收——你不需要自己 `mkdir`/`rmdir`。

### docker

```bash
docker run -d --name ctr --memory=128m --cpus=0.5 --entrypoint /bin/sh alpine -c 'sleep 300'
PID=$(docker inspect --format '{{.State.Pid}}' ctr)
CG=$(cut -d: -f3 /proc/$PID/cgroup)
echo $CG
cat /sys/fs/cgroup$CG/memory.max
cat /sys/fs/cgroup$CG/cpu.max
cat /sys/fs/cgroup$CG/memory.high
cat /sys/fs/cgroup$CG/memory.swap.max
```

```text
/system.slice/docker-4666dc11126a645998d83262019e83989d45b047ecff477f9a7930c6fbe32ae5.scope
134217728
50000 100000
max
134217728
```

`--memory=128m` → `memory.max = 134217728`（128MiB），`--cpus=0.5` → `cpu.max = 50000 100000`。

**看最后一行**：`memory.swap.max = 134217728`，和 `memory.max` **一样大**。这回答了 5.4 的悬念。

不设 `--memory-swap` 时，docker 把它当作 `2 × --memory`，所以容器可用总额是 `memory.max + memory.swap.max`。实测这个边界（`--memory=128m`，即 128M 内存 + 128M swap = 256M 总额）：

```text
分配 200M  -> 退出码 0    存活
分配 240M  -> 退出码 0    存活    (256M 预算内)
分配 400M  -> 退出码 137  被 OOM  (超出预算)
```

对照组是**同样的 `memory.max=128M`，但 swap 不限**的手工 cgroup：

```text
分配 200M  -> 退出码 0    存活
分配 400M  -> 退出码 0    存活
分配 1000M -> 退出码 0    存活    (全被换出到 swap)
```

所以：

- 手工 `mkdir` 建组 + 设 `memory.max`：`memory.swap.max` 默认 `max`，**swap 无限兜底**，超了就换出，进程不死（实验 5.1）
- `docker run --memory=128m`：swap 被锁在 128M，**回收空间有上限**，超过总额就真 OOM

这就是为什么「手工玩 cgroup 时没被 OOM，一放进容器就被杀了」。**不是容器更严格，是它的默认值更严。** 排查容器 OOM 时，光看 `--memory` 不够，还要看 `--memory-swap` 给了多少余量。

清理：

```bash
docker rm -f ctr
ls -d /sys/fs/cgroup$CG
```

```text
ls: 无法访问 '.../docker-4666...scope': 没有那个文件或目录
```

和 systemd 一样，容器删除后 cgroup 自动回收。

## 写实验脚本时的三个坑

上面所有实验我都真跑过，踩了三个坑。如果你要自己动手，这三个坑你大概率也会遇到。

### 坑 1：进程没进组，你的限制就是零

这是最危险的一个，我自己就因此把一台机器搞死机过。

给一个组启用 `subtree_control` 之后，**它就不能再直接接收进程了**（实验 3.2 的双向规则）。这时候如果你写：

```bash
echo $$ > /sys/fs/cgroup/cglab/exp/cgroup.procs
```

会得到 `EBUSY`，进程**留在原处**。如果脚本没检查这个错误就继续往下跑，进程就会在**完全没有限制**的地方运行。

我当时在一个启用了 `pids` controller 的叶子组里跑 fork 炸弹，入组失败（EBUSY），于是 fork 炸弹在宿主机上无限制地跑了起来，把机器搞死了。

正确做法是**让入组失败变成致命错误**：

```python
try:
    with open(os.path.join(CGROUP, "cgroup.procs"), "w") as f:
        f.write(str(os.getpid()))
except OSError as e:
    print(f"FATAL: 无法进入 {CGROUP}: {e}", file=sys.stderr)
    sys.exit(1)          # 必须退出，绝不能继续
```

本文的四个脚本都带这道保护。另一条原则：**给叶子组启用 `subtree_control` 之前，先问自己「我还需要往这个组里放进程吗」**。

### 坑 2：`( echo $$ > ... )` 写的是父进程的 PID

`$$` 在子 shell 里**不会变**：

```bash
bash -c "echo outer=$$; ( echo subshell_sees=$$ )"
```

```text
outer=2326916
subshell_sees=2326916
```

两者完全相同。所以

```bash
( echo $$ > /sys/fs/cgroup/xxx/cgroup.procs; exec python3 work.py )
```

把**父脚本自己**写进了组，python 根本没进去。表现是 `memory.current` 一直是几 MB、`high` 计数一直是 0——**数据全是假的**，但不会报任何错。

正确做法是拿到子进程真实的 PID：

```bash
python3 work.py &
PID=$!
echo $PID > /sys/fs/cgroup/xxx/cgroup.procs
```

或者让进程**自己**写自己（本文脚本用的方式）：

```python
open("/sys/fs/cgroup/xxx/cgroup.procs", "w").write(str(os.getpid()))
```

自我进组还有个额外好处：它消灭了竞态。

### 坑 3：先启动进程、后写 cgroup.procs，会漏掉子进程

```bash
python3 spawn_many.py &          # 它立刻就 fork 了一堆子进程
echo $! > /sys/fs/cgroup/xxx/cgroup.procs    # 只搬了父进程
```

写 `cgroup.procs` 只搬**那一个进程**（及其线程组）。已经 fork 出去的子进程留在原 cgroup 里——它们既不受你的限制，清理时也找不到，会在系统里变成孤儿。

我自己踩这个坑时残留了 100 个孤儿进程。

正确做法是**先入组、再 fork**：

```python
# 自我进组（此时还没有子进程）
open(CGROUP + "/cgroup.procs", "w").write(str(os.getpid()))
# 然后才 fork —— 子进程自动继承 cgroup
for i in range(N):
    os.fork()
```

cgroup 成员关系是**被 fork 继承**的，所以只要父进程入组成功，之后 fork 出来的所有后代都在组里。

> [!TIP] 三条坑的共同点
> 它们都不会报错，只会让你的实验数据变成假的，或者在系统里留下失控进程。**「验证进程真的进组了」应该是每个实验的第一步**：`cat /proc/<pid>/cgroup` 和 `cat <组>/cgroup.procs` 对一下。

## 排错表：五个 errno

在 `/sys/fs/cgroup` 下写文件时，报错信息通常很含糊（中文 locale 下是「设备或资源忙」「权限不够」）。对照 errno 数值能直接定位原因。下表每一行都在本文的机器上实测过：

| errno | 消息 | 触发场景 | 修法 |
|---|---|---|---|
| `ENOENT` (2) | 没有那个文件或目录 | 往子组 `cgroup.subtree_control` 写 `+memory`，但**父组没启用 memory** | 先往父组启用：`echo "+memory" > <父组>/cgroup.subtree_control` |
| `EACCES` (13) | 权限不够 | ① 不是 root；② 组里**没有这个文件**（controller 未启用），例如写 `memory.max` | 用 root；先 `ls <组>` 确认文件存在 |
| `EBUSY` (16) | 设备或资源忙 | **no internal process**：① 组里有进程时启用 domain controller；② 组已下放 controller 后往它自己写进程 | 把进程挪进子组让父组变空；或改用 threaded controller（cpu/cpuset/pids） |
| `ENOTSUP` (95) | 不支持的操作 | 组已是 `domain threaded`，再想启用 domain controller | 先把 threaded controller 撤掉（`echo "-cpu" > ...`）让它退回 `domain` |
| `EINVAL` (22) | 无效的参数 | ① `+cpu memory` 少了第二个 `+`；② `cpu` 完全没 `+`；③ 写了不存在的 controller；④ 往 `cgroup.procs` 写非数字；⑤ 往只读文件写 | 每个 controller 前都要带 `+` |

实测验证过的三个易错点：

```text
往子组写 '+memory' (父组没启用 memory)   -> errno=2   (ENOENT)
往子组写 memory.max (文件不存在)         -> errno=13  (EACCES)
'已 domain threaded, 再要 +memory'      -> errno=95  (ENOTSUP)
```

注意 `ENOENT` 和 `EACCES` 的区别：**`ENOENT` 是「父组没下放这个 controller」，`EACCES` 是「这个组的这个文件不存在」**。两者都表现为「写不进去」，但修法完全不同。

另一个高频错误：`echo "+cpuset cpu io memory" > cgroup.subtree_control` 会报 `EINVAL`，正确写法是**每个 controller 前都要有 `+` 号**：

```bash
echo "+cpuset +cpu +io +memory" > cgroup.subtree_control
```

用 Python 能看到精确的 errno：

```python
try:
    open("/sys/fs/cgroup/xxx/memory.max", "w").write("100M")
except OSError as e:
    print(e.errno, e.strerror)
```

## 速查表：systemd ↔ docker ↔ cgroup 文件

| 想限制什么 | cgroup v2 文件 | systemd | docker |
|---|---|---|---|
| 内存硬上限 | `memory.max` | `MemoryMax=100M` | `--memory=128m` |
| 内存软限（超了限流） | `memory.high` | `MemoryHigh=80M` | `--memory-reservation`（见下注） |
| 内存保底（尽量不回收） | `memory.low` | `MemoryLow=40M` | `--memory-reservation=80m` |
| swap 上限 | `memory.swap.max` | `MemorySwapMax=0` | `--memory-swap=256m`（总量） |
| CPU 上限（绝对） | `cpu.max` | `CPUQuota=50%` | `--cpus=0.5` |
| CPU 权重（相对） | `cpu.weight` | `CPUWeight=200` | `--cpu-shares=512` |
| 绑定 CPU 核 | `cpuset.cpus` | `AllowedCPUs=0-3` | `--cpuset-cpus=0-3` |
| 进程数上限 | `pids.max` | `TasksMax=100` | `--pids-limit=100` |
| 冻结整组 | `cgroup.freeze` | `systemctl freeze <unit>` | `docker pause` |
| 杀掉整组 | `cgroup.kill` | `systemctl kill <unit>` | `docker kill` |

几个实测出来、容易记错的点：

**1. `--memory-reservation` 写的是 `memory.low`，不是 `memory.high`。** 这是最容易搞错的一条——docker 的 `--memory-reservation` 对应内核的**保底内存**（`memory.low`，尽量不回收），而**不是软限**。想要软限得用 systemd 的 `MemoryHigh=`，docker 没有直接对应的参数：

```text
--memory=128m --memory-reservation=80m
  ->  memory.max=134217728  memory.high=max  memory.low=83886080
```

**2. `--memory-swap` 是「内存 + swap」的总量，不是单独的 swap 量。** 实测（`--memory=128m`）：

```text
--memory-swap=256m  ->  memory.swap.max = 134217728  (256M - 128M = 128M)
--memory-swap=512m  ->  memory.swap.max = 402653184  (512M - 128M = 384M)
--memory-swap=-1    ->  memory.swap.max = max        (不限)
```

不设 `--memory-swap` 时，docker 默认把它当作 `2 × --memory`，所以 `memory.swap.max` 等于 `memory.max`——容器最多可以再用与内存等量的 swap（总量翻倍）。而裸 cgroup 的默认值是 `max`（不限）。

**3. `--cpu-shares` 到 `cpu.weight` 是非线性换算。** 不是简单的 `weight = shares/10.24`。实测对比（同一台机器，docker 与 systemd 结果**不同**）：

| `--cpu-shares` / `CPUShares=` | docker → `cpu.weight` | systemd → `cpu.weight` |
|---|---|---|
| 100 | 17 | 9 |
| 256 | 35 | 25 |
| 512 | 59 | 50 |
| 1024 | 100 | 100 |
| 2048 | 174 | 200 |
| 4096 | 303 | 400 |

两边只在默认值 `1024 ↔ 100` 处对齐。原因：v1 的 `cpu.shares`（范围 2–262144）和 v2 的 `cpu.weight`（范围 1–10000）区间不同，换算公式本身是分段/二次的，而且 docker 和 systemd 各自实现了一套。**结论：不要手算，直接读 `cpu.weight` 确认。**

**4. `--cpus=0.5` 是绝对上限，`--cpu-shares` 是相对权重。** 前者写进 `cpu.max`（天花板），后者写进 `cpu.weight`（只在争抢时决定分配比例，不设上限）。

## 下一步

这篇文章只碰了 `cpu` / `memory` / `pids` 三个 controller，也没展开 PSI 的完整用法。如果你想继续：

- **`io.max`** —— 限制磁盘读写带宽/IOPS，和 `cpu.max` 同构，但需要真实块设备才好观察
- **`cpuset.cpus` / `cpuset.mems`** —— 把进程绑到指定 CPU 核和 NUMA 节点，是延迟敏感服务的常用手段
- **PSI 深入** —— `cpu.pressure` / `memory.pressure` / `io.pressure` 是判断「资源不够」比使用率更准的指标
- **cgroup v1 迁移** —— 老系统上还会遇到，判断方法就是本文那条 `stat -fc %T`
- **k8s 的 QoS 分级** —— `Guaranteed` / `Burstable` / `BestEffort` 本质上就是不同的 `memory.max` / `cpu.max` 组合

但核心心法已经在本文里了：**cgroup 是一棵目录树，限制就是往文件里写数字，而 no-internal-process 规则决定了树该怎么长。**
