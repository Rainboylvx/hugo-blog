---
title: "状态机与非阻塞程序：同时处理按键、定时与 LED"
date: 2026-10-19
draft: true
toc: true
weight: 9
tags: ["ESP32-S3", "ESP-IDF", "状态机", "按键", "LED", "BSP"]
---

本课是基础补充：用一个任务同时扫描 BOOT、切换模式、定时闪灯。按键始终可以响应，不会为了等待下一次闪灯而暂停整个业务。

配套工程：[`examples/09-event-state-machine`](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/09-event-state-machine)。构建结果见文末，按键、消抖与实际响应延迟尚待实板验收。

## 1. 从“按顺序等完”变成“每次推进一点”

如果主循环先点灯、等 500 ms、熄灯、再等 500 ms，按键可能需要等待接近 1 秒才被扫描。即使 `vTaskDelay()` 已经把 CPU 让给其他任务，本任务内的后续业务仍要等它返回。

解决办法是保存状态和进入状态的时间。每轮只检查“有没有新输入、当前应该输出什么”，然后很快返回下一轮。

![三个模式的转换关系](./assets/09-state-machine/state-flow.svg)

模式顺序是：熄灭 → 常亮 → 闪烁 → 熄灭。每次稳定按下只转换一次；长按不连续跳转。进入闪烁时立即点亮，500 ms 后熄灭，再过 500 ms 点亮。

## 2. 接线与电平

![BOOT 连接 GPIO0](./assets/03-key/boot-gpio0-schematic.png)

![红色 LED 连接 GPIO1](./assets/02-led/led-circuit.png)

DNESP32S3 V1.2：BOOT 按下使 GPIO0 变低，程序启用内部上拉；GPIO1 低电平点亮 LED。无需外设。BOOT 也是启动配置引脚，实验时先正常启动，再按键，不要按住 BOOT 复位来测试业务。

## 3. 状态、事件和输出分别是什么

| 名称 | 本例内容 | 保存在哪里 |
| --- | --- | --- |
| 状态 | OFF、ON、BLINK | `mode` |
| 输入事件 | 一次稳定按下 | `key_poll()` 返回值 |
| 时间基准 | 进入当前模式的时刻 | `entered_at` |
| 输出 | 此时 LED 应该亮还是灭 | `on` |

本例只有一个业务任务，不需要为了“有事件”而强行增加队列。变量由一个任务独占，状态转换也在同一处完成。第 12 课有多个生产者时再使用队列。

```c
// 枚举比散落在各处的 0、1、2 更容易表达业务含义。
typedef enum { MODE_OFF, MODE_ON, MODE_BLINK } mode_t;

if (key_poll(now)) {
    mode = (mode + 1) % 3; // 一次事件只前进一个状态。
    entered_at = now;     // 每次进入新状态重新建立时间基准。
}
```

## 4. 消抖也要分成多次检查

第 03 课的消抖函数通过短暂 `vTaskDelay()` 再次确认电平。本课把等待改成时间戳，`KEY` BSP 提供：

```c
// now_us 来自单调时钟。函数立即返回，不在内部等待触点稳定。
bool key_poll(int64_t now_us);
```

它保存原始电平、已经确认的稳定电平，以及原始电平最近变化的时间：

```c
if (raw != s_raw) {
    s_raw = raw;
    s_changed_at = now_us; // 每次抖动都会重新开始计时。
}
if (now_us - s_changed_at < 20000) return false;
```

电平连续稳定 20 ms 后才更新稳定状态。稳定下降沿产生一次按下事件；稳定松开后才允许下一次按下。这样松开抖动也不会立即重新武装按键。代码还避免把上电时已经按住的键当成新按下。

`key_poll()` 必须定期调用，不能两秒才检查一次。它的内部状态由扫描任务独占，不允许多个任务同时调用。

## 5. 按经过时间计算闪烁相位

```c
// now 和 entered_at 的单位都是微秒。
bool on = mode == MODE_ON ||
    (mode == MODE_BLINK && ((now - entered_at) / 500000) % 2 == 0);
```

进入 BLINK 后经过 0～499999 us，整数除法结果是 0，LED 点亮；经过 500000～999999 us，结果是 1，LED 熄灭；下一段结果变成 2，又点亮。

如果任务因别的工作迟到 20 ms，下次仍按真实经过时间计算，不会每次把延迟都叠加进周期。若系统迟到得太久，部分闪烁会被跳过；状态机不能恢复没有实际输出的历史边沿。

只有目标输出变化时才调用 `led_set()`，避免每轮重复写相同电平。

## 6. “非阻塞业务”为什么还有 delay

```c
// 相对上一轮计划唤醒时间，保持约 10 ms 的扫描节拍。
vTaskDelayUntil(&wake, pdMS_TO_TICKS(10));
```

这里阻塞当前任务 10 ms 左右是主动让出 CPU。业务没有为了等待闪灯暂停 500 ms，按键检查一直按短节拍进行。这就是本课所说的非阻塞程序。

本工程设置 `CONFIG_FREERTOS_HZ=1000`，所以 10 ms 对应 10 个 tick。`pdMS_TO_TICKS()` 是换算宏，不是延时函数；真正阻塞的是 `vTaskDelayUntil()`。

若每轮业务长期超过 10 ms，固定周期循环可能赶不上计划，需要减少每轮工作量或把慢 I/O 交给其他任务。不能把此调用理解为保证任何负载下都能准时响应。

## 7. BSP、应用与工程注册

`components/BSP/KEY` 只输出按键事件，`components/BSP/LED` 只转换逻辑亮灭与 GPIO 电平。OFF/ON/BLINK 和 500 ms 间隔属于应用，保存在 `main.c`。

```cmake
# main 的依赖包括 BSP、单调时钟和任务 API。
idf_component_register(SRCS "main.c" INCLUDE_DIRS "."
    PRIV_REQUIRES BSP esp_timer freertos)
```

这里使用 `esp_timer_get_time()` 读取时间，没有创建 `esp_timer` 定时回调。读取单调时钟与申请一个周期定时器是两种不同操作。

## 8. 构建与实板验收

```bash
# 激活环境后进入本课根目录。
source ~/.espressif/tools/activate_idf_v5.5.5.sh
cd ~/mycode/esp32-blog/examples/09-event-state-machine
idf.py build
# 替换为真实开发板端口。
idf.py -p <实际串口> flash monitor
```

依次按 BOOT，日志应该显示 `mode=1`、`mode=2`、`mode=0`。观察常亮、500 ms 翻转和熄灭是否对应；按住两秒只切换一次；在闪烁刚开始和即将结束时按键，模式都应及时切换。

消抖时间 20 ms，加上约 10 ms 扫描粒度与调度延迟，响应不是零延迟，也不能仅靠这些配置声称实测响应一定小于某个数值。

进一步练习：增加“快闪”状态，修改状态转换和相位计算，不要增加长时间等待。能做到这一点，就理解了状态机保存进度的价值。

本课为基础补充，没有一一对应的官方实验源码。它复用了前面课程的 GPIO 约定，并以单任务状态所有权避免跨任务共享变量。

下一课：[软件 PWM：用定时节拍调节 LED 亮度](./10-software-pwm.md)。
