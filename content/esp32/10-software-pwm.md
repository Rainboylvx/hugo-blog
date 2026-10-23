---
title: "软件 PWM：用定时节拍调节 LED 亮度"
date: 2026-10-19
draft: true
toc: true
weight: 10
tags: ["ESP32-S3", "ESP-IDF", "PWM", "GPTimer", "LED", "BSP"]
---

闪灯改变的是人能看清的亮灭状态；PWM 则把一个短周期分成亮和灭两部分，通过改变点亮时间比例调节平均亮度。本课用 GPTimer 中断逐槽写 GPIO，做出 0%、25%、50%、75%、100% 五档亮度。

配套工程：[`examples/10-software-pwm`](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/10-software-pwm)。构建结果见文末，亮度、频率和抖动尚待实板验收。

> [!INFO] 与教材第 17 章的区别
> 教材“SW_PWM”使用 LEDC 生成波形，由软件调用 API 更新占空比。这里的“软件 PWM”进一步拆开波形生成过程：由 GPTimer 中断中的软件决定 GPIO 高低电平。理解两者后，再进入第 11 课的 LEDC 硬件渐变。

## 1. GPIO1 的有效电平决定占空比怎么解释

![GPIO1 红色 LED 电路](./assets/02-led/led-circuit.png)

板载红色 LED 低电平点亮。因此本课约定“逻辑亮度”是**低电平占整个周期的比例**。示波器按高电平计算的 duty 会与它互补。

| 逻辑亮度 | 低电平槽数 | 高电平槽数 | 预期现象 |
| --- | --- | --- | --- |
| 0% | 0 | 20 | 熄灭 |
| 25% | 5 | 15 | 较暗 |
| 50% | 10 | 10 | 中间亮度 |
| 75% | 15 | 5 | 较亮 |
| 100% | 20 | 0 | 常亮 |

真实视觉亮度与 duty 不成简单线性关系。这里验证档位有变化，不把 50% duty 当成人眼感受的“恰好一半亮”。

## 2. 先算清频率、时间槽与中断负担

![软件 PWM 时间槽关系](./assets/10-software-pwm/pwm-slots.svg)

本例每 500 us 进入一次 GPTimer 报警回调，每周期 20 槽：

```text
PWM 周期 = 500 us × 20 = 10000 us = 10 ms
PWM 频率 = 1 / 10 ms = 100 Hz
逻辑亮度步长 = 1 / 20 = 5%
中断频率 = 100 Hz × 20 = 2000 次/秒
```

20 槽提供包含两端在内的 21 个逻辑亮度值。这是按槽数描述的分辨率，不应称为“20 位分辨率”。

如果希望同时做到 1 kHz PWM 和 256 槽，就要每秒执行 256000 次中断，单槽仅约 3.9 us。中断和函数调用成本很容易超过预算；因此本课选择保守的教学参数，不追求高频高精度。

## 3. BSP 如何逐槽产生波形

`components/BSP/SOFT_PWM` 独占 GPIO1 和 GPTimer，向应用提供两个接口：

```c
// 初始化硬件并启动软件 PWM，默认熄灭。
esp_err_t soft_pwm_init(void);
// 设置下一周期的点亮槽数，有效范围 0..20。
esp_err_t soft_pwm_set(unsigned slots_on);
```

GPTimer 配置为 1 MHz，每计数一次是 1 us；报警值为 500，自动重载为 0。回调的关键部分是：

```c
// s_phase 依次经过 0..19，前 s_active 个槽点亮。
gpio_set_level(GPIO_NUM_1, s_phase < s_active ? 0 : 1);
s_phase = (s_phase + 1) % SOFT_PWM_SLOTS;
```

ISR 不等待、不分配内存、不打印日志。这里必须在 ISR 写 GPIO：如果每个槽都先通知任务，再由任务写 GPIO，调度延迟会进一步破坏波形。

这不表示所有业务都适合移入中断。代码刻意把 ISR 缩减为锁存目标值、输出电平和推进相位三件小事。

## 4. 新占空比为什么到下一周期才生效

假设当前周期已经走到第 12 槽，此时把亮度从 25% 改为 75%。如果直接修改当前比较值，后半周期可能突然再次点亮，出现一个周期内两段低电平。

本例区分两个变量：

- `s_pending`：任务刚提交的新目标。
- `s_active`：当前周期已经锁存的目标。

```c
if (s_phase == 0) {
    // ISR 与任务共享 pending，使用同一把自旋锁保护。
    portENTER_CRITICAL_ISR(&s_lock);
    s_active = s_pending;
    portEXIT_CRITICAL_ISR(&s_lock);
}
```

任务通过对应的 `portENTER_CRITICAL()` 写入 `s_pending`。ESP32-S3 是双核，不能用一个 `volatile` 就宣称共享访问安全。`s_phase`、`s_active` 则只由 ISR 修改。

新目标最迟在下一个 PWM 周期边界锁存。任务提交到物理生效可能相差接近 10 ms，属于本例设计的一部分。

## 5. 亮度演示任务

```c
const unsigned levels[] = {0, 5, 10, 15, 20};
while (1) {
    for (unsigned i = 0; i < sizeof(levels) / sizeof(levels[0]); ++i) {
        ESP_ERROR_CHECK(soft_pwm_set(levels[i]));
        // 停留 1.5 秒便于观察档位，PWM ISR 会继续运行。
        vTaskDelay(pdMS_TO_TICKS(1500));
    }
}
```

这里没有同时处理按键，所以允许任务等待一个档位的展示时间。如果之后加按键控制，应参考第 09 课的时间戳状态机，避免让同一个业务任务睡满 1.5 秒。

## 6. 软件 PWM 的边界

GPTimer 自动重载稳定地安排报警，但 GPIO 仍是 CPU 执行代码后才改变。中断被延迟时，实际脉冲宽度就会改变；延迟过久也不能保证补执行所有历史时间槽。

工程没有启用 GPTimer cache safe 模式，Flash cache 不可用时中断可能延后。不要把本例作为 Flash 写入期间仍然严格连续的波形源。也不能只加 `IRAM_ATTR` 就声称安全，还需要检查驱动、GPIO 操作和数据放置。

100 Hz 只是教学参数，移动视线或用相机拍摄仍可能看见闪烁或条纹。实际产品需要结合负载、视觉要求与功耗选频率，连续 LED 调光优先使用 LEDC。

## 7. 编译、烧录与测量

```bash
# 激活 IDF 后构建本课。
source ~/.espressif/tools/activate_idf_v5.5.5.sh
cd ~/mycode/esp32-blog/examples/10-software-pwm
idf.py build
# 用实际端口烧录并查看每 1.5 秒一次的亮度档位日志。
idf.py -p <实际串口> flash monitor
```

预期日志依次为 `logical brightness=0%`、`25%`、`50%`、`75%`、`100%`，然后循环。肉眼检查五档变化；有仪器时，将探头接 GPIO1，地接板上 GND，观察约 10 ms 周期。

25% 逻辑亮度时，预期低电平约 2.5 ms，高电平约 7.5 ms；0% 和 100% 是稳定电平，不能要求它们仍然有 PWM 边沿。不要把 GPIO 接入超过 3.3V 的外部驱动信号。

完成标准：能设置任意 0..20 槽、看到档位变化，并解释 `f_ISR = f_PWM × 槽数`。测量值与理论值不同时，应分别检查参数和中断延迟，而不是只根据串口日志判断波形合格。

对照教材：第 17 章的 `ledc_set_duty()` 和 `ledc_update_duty()` 只在软件侧修改目标，波形始终由 LEDC 硬件产生。本课的 GPIO 写入频率随槽数增加，是为了展示真正的软件逐槽 PWM 成本。

相关依据：[GPTimer 驱动与回调约束](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/peripherals/gptimer.html)、[LEDC 软件更新占空比接口](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/peripherals/ledc.html)。

下一课：[LEDC 硬件 PWM：制作平滑呼吸灯](./11-ledc-hardware-fade.md)。
