---
title: "魔搭免费实例SSH穿透与llama.cpp编译"
date: 2026-09-06T14:40:00+08:00
draft: true
toc: true
tags: ["ssh","linux","llama.cpp","gpu"]
categories: [""]
---

## 1. 背景:魔搭免费实例无法直接 SSH

魔搭(ModelScope)免费 GPU 实例实际上是一个容器,`ip a` 只能看到内网地址:

```
eth0: inet 22.9.0.202/32    # 云内网 IP
net0: inet 172.31.2.15/24   # 云内网 IP
```

即使在容器里装好 openssh-server,从自己的电脑 ping 不通、22 端口也连不上 —— 实例不在公网,外部根本无法直连。要远程连接只有一条路:**让实例主动向外建隧道(网络穿透)**。

## 2. 方案:用自己的公网服务器做跳板

思路:实例内网出网是自由的(apt 都能用),让它主动 SSH 连到一台有公网 IP 的服务器,把实例的 22 端口"反向映射"过去,本地电脑再经这台服务器跳转访问。

```
本地电脑 --ssh--> 公网VPS(跳板) <--ssh -R 反向隧道-- 魔搭实例(22端口)
```

> [!TIP] 选跳板的标准
> 跳板服务器只需要两点:公网 IP、sshd 允许 TCP 转发(默认就允许)。延迟越低越好 —— 实测换了个 25ms 的服务器后明显比原来那台流畅。

### 2.1 把魔搭的公钥加入跳板

在魔搭实例里生成密钥,公钥添加到跳板的 `authorized_keys`:

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
# 把 id_ed25519.pub 的内容追加到跳板的 ~/.ssh/authorized_keys
```

### 2.2 魔搭实例建立反向隧道

```bash
ssh -N -R 127.0.0.1:4222:localhost:22 \
    -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
    -o StrictHostKeyChecking=accept-new \
    root@<VPS_IP>
```

含义:`-R 127.0.0.1:4222:localhost:22` 把本机(实例)的 22 端口,映射到跳板机的 `127.0.0.1:4222`。跳板机 sshd 默认 `GatewayPorts no`,所以反向端口只绑在跳板本机 —— 这反而更安全,不影响使用,见下。

> [!WARNING] 隧道是实例发起的
> 实例重启、休眠后隧道就断了,需要重新执行。建议配合 `autossh` 保活。

### 2.3 本地连接

由于 4222 只绑在跳板的 127.0.0.1 上,本地要用 `-J`(ProxyJump)先跳过去,最终连接在跳板机上发起,正好能命中:

```bash
ssh -J <跳板别名> -p 4222 root@127.0.0.1
```

顺手把本机公钥也加入实例的 `authorized_keys`(在实例的网页终端里操作),就能免密。之后加个别名,`ssh mota` 一步到位:

```
Host mota
    HostName 127.0.0.1
    Port 4222
    User root
    ProxyJump bohai        # bohai = 本地 ssh config 里的跳板别名
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

> [!IMPORTANT] 两个方向都要授权
> 隧道方向(实例→跳板)要实例的公钥;连接方向(本地→实例)要本地的公钥。漏了后者就会出现"隧道通了却一直要密码"。

## 3. 换国内 apt 源

实例默认走 `archive.ubuntu.com`,换成阿里云,备份原文件:

```bash
cp /etc/apt/sources.list /etc/apt/sources.list.bak
cat > /etc/apt/sources.list <<"EOF"
deb http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse
EOF
apt-get update
```

## 4. 这台实例的 GPU:AMD MI300X

魔搭免费实例给的是 AMD 卡,不是 NVIDIA —— `nvidia-smi` 不存在,工具链是 ROCm:

```bash
cat /opt/rocm/.info/version       # ROCm 7.2.3
rocminfo | grep -E "Name|gfx"     # 识别出 gfx942
/opt/rocm/bin/rocm-smi --showmeminfo vram
```

```
GPU[0] : VRAM Total Memory (B): 205822885888   # ≈ 192 GiB
```

Device ID `74b6` + 192GB 显存 → **AMD MI300X**(gfx942)。

> [!INFO] rocm-smi 报错不代表环境坏
> 这台实例上 `rocm-smi` 报 `get_name, Error when calling libdrm`,但 `rocminfo` 完全正常、HIP 库齐全 —— 以后端是否能编译/运行为准,别被单个工具吓到。

## 5. 编译 llama.cpp(HIP 后端)

llama.cpp 官方不提供 ROCm 预编译包,AMD GPU 需要源码编译、启用 HIP:

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
cmake -B build -DGGML_HIP=ON -DAMDGPU_TARGETS=gfx942 -DCMAKE_BUILD_TYPE=Release
cmake --build build -j 23
```

参数要点:

- `GGML_HIP=ON`:启用 AMD HIP 后端
- `AMDGPU_TARGETS=gfx942`:MI300X 是 CDNA3 架构,必须指定,否则可能编成不兼容的目标

### 5.1 遇到的坑:构建卡在 99% 的 UI 下载

构建到 99% 后长时间不动,日志停在:

```
-- UI: download dist.tar.gz from b1 failed: "Timeout was reached"
-- UI: downloading from latest: https://huggingface.co/buckets/ggml-org/llama-ui/...
```

llama.cpp 的 `llama-ui-assets` target 会把 llama-server 的网页 UI 资源(从 Hugging Face 下载的 `dist.tar.gz`)编译进二进制。容器访问不了 huggingface.co,下载超时,把整个构建卡住(留下 0 字节的 `dist.tar.gz`)。

排查 `tools/ui/CMakeLists.txt` 和 `scripts/ui-assets.cmake` 后理清了逻辑:资源来源优先级是 npm 本地构建 > HF 下载,受两个 CMake 变量控制:

- `LLAMA_BUILD_UI`:是否构建 UI(OFF 时不做 npm 构建)
- `LLAMA_USE_PREBUILT_UI`:是否允许从 HF 下载预构建资源(ON 时,即使 BUILD_UI=OFF 也**仍会尝试下载**,这就是关了 BUILD_UI 还在下载的原因)

两个都关掉,下载就会被跳过:

```bash
cmake -B build -DLLAMA_BUILD_UI=OFF -DLLAMA_USE_PREBUILT_UI=OFF
cmake --build build -j 23
```

> [!NOTE] 其实不用等它失败
> `scripts/ui-assets.cmake` 最后一段逻辑:下载失败只打 WARNING "no assets available - building without an embedded UI",然后照样生成 `ui.cpp/ui.h` 继续编译。也就是说干等几分钟让下载超时失败,构建也会正常完成 —— llama-server 不带网页 UI,但 OpenAI 兼容 API 完全不受影响。想带 UI,以后可从 llama.cpp 的 GitHub release 手动下载 `dist.tar.gz` 解压到 `tools/ui/dist/`。

### 5.2 验证 HIP 生效

```bash
/root/llama.cpp/build/bin/llama-cli --list-devices
```

```
Available devices:
  ROCm0:  (196288 MiB, 195960 MiB free)
```

看到 `ROCm0` 且能读到显存,说明 HIP 后端编译正确、GPU 完全可用。产物在 `build/bin/llama-cli` 和 `build/bin/llama-server`,下一步就是下载模型开跑。

## 6. 下载模型:直连 HF 失败,走 hf-mirror 镜像

### 6.1 连通性实测

容器访问不了 huggingface.co,但镜像可以:

```bash
curl -sI --max-time 10 https://huggingface.co -o /dev/null -w "%{http_code}"   # 000,连接失败
curl -sI --max-time 10 https://hf-mirror.com -o /dev/null -w "%{http_code}"    # 200,可达
```

所以要么给 huggingface_hub 设环境变量 `HF_ENDPOINT=https://hf-mirror.com`,要么直接用镜像 URL 下载。

> [!INFO] 先探测模型仓库,别凭名字猜
> 用镜像的搜索 API 可以确认模型真实存在与完整 ID:
> `curl "https://hf-mirror.com/api/models?search=<关键词>"` 返回 JSON,包含完整 repo id、下载量、标签。
> 实际找到的模型全名是 `HauhauCS/Qwen3.8-27B-Uncensored-HauhauCS-Aggressive-MTP-GGUF`(原以为的名字少了 owner 前缀和 `-GGUF` 后缀,裸名直接 404)。仓库里还提供 `SHA256SUMS` 和量化清单。

### 6.2 选量化:显存够大就选 Q8_K_P

实例显存 192GB,不存在放不下的问题,直接选质量最高的 `Q8_K_P`(9.21 BPW,31.5GB)。该仓库是 multimodal 模型,各量化文件已保留 Qwen3.8 原生的 NextN(MTP)head,另有 0.9GB 的 `FastMTP-32K.gguf` 加速 sidecar 和 BF16 的 `mmproj`(视觉投影),纯文本对话不需要它们。

### 6.3 下载命令

```bash
mkdir -p /root/models && cd /root/models
nohup curl -L -C - --retry 10 --retry-delay 5 \
  -o Qwen3.8-27B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf \
  "https://hf-mirror.com/HauhauCS/Qwen3.8-27B-Uncensored-HauhauCS-Aggressive-MTP-GGUF/resolve/main/Qwen3.8-27B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf" \
  > /root/model_dl.log 2>&1 &
```

要点:`-C -` 断点续传,`--retry` 自动重试,`nohup` 让下载在 SSH 断开后继续。实测速度约 42MB/s,31.5GB 约 12 分钟。

### 6.4 判断下载完成

curl 进程退出不代表文件完整,最可靠的是拿实际字节数对比服务器的 `Content-Length`:

```bash
stat -c "%s" /root/models/*.gguf    # 实际字节
curl -sIL <镜像URL> | grep -i "^content-length" | tail -1   # 期望字节
```

实测两者一致:`31457990784` 字节 = 完整下载。之后可用仓库的 `SHA256SUMS` 进一步校验。

## 7. 调用模型

### 7.1 交互式聊天

```bash
/root/llama.cpp/build/bin/llama-cli \
  -m /root/models/Qwen3.8-27B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf \
  -c 32768 -ngl 999
```

- `-c 32768`:上下文长度(模型支持 32K)
- `-ngl 999`:全部层加载到 GPU(ROCm0)
- 进入后直接输入聊天,`/exit` 退出;加 `-cnv` 保留多轮历史

### 7.2 API 服务

```bash
/root/llama.cpp/build/bin/llama-server \
  -m /root/models/Qwen3.8-27B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf \
  -c 32768 -ngl 999 --port 8080
```

另开终端验证(OpenAI 兼容格式):

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3.8","messages":[{"role":"user","content":"你好"}]}'
```

> [!NOTE] MTP 与视觉是可选件
> 纯文本对话不需要 `FastMTP-32K.gguf`(加速 sidecar)和 `mmproj`(视觉投影)。若启动时报 MTP/NextN 张量不支持的错误,是当前 llama.cpp 版本对该模型的支持问题,与下载无关。

## 8. 命令清单速查

| 用途 | 命令 |
|---|---|
| 实例建立隧道 | `ssh -N -R 127.0.0.1:4222:localhost:22 root@<VPS_IP>` |
| 本地连接 | `ssh mota`(config 别名 + ProxyJump) |
| 看 GPU | `/opt/rocm/bin/rocm-smi --showmeminfo vram` |
| 看架构 | `rocminfo \| grep gfx` |
| 编译 llama.cpp | `cmake -B build -DGGML_HIP=ON -DAMDGPU_TARGETS=gfx942 -DLLAMA_BUILD_UI=OFF -DLLAMA_USE_PREBUILT_UI=OFF` |
| 验证设备 | `build/bin/llama-cli --list-devices` |
| 探测模型 | `curl "https://hf-mirror.com/api/models?search=<关键词>"` |
| 下载模型 | `curl -L -C - <hf-mirror resolve URL> -o model.gguf` |
| 校验完整 | `stat -c "%s" model.gguf` 对比 `Content-Length` |
| 交互聊天 | `build/bin/llama-cli -m model.gguf -c 32768 -ngl 999` |
| API 服务 | `build/bin/llama-server -m model.gguf -c 32768 -ngl 999 --port 8080` |
