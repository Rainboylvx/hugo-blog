---
title: "cairo图形库入门"
date: 2025-10-18
draft: false
toc: true
tags: ["C++", "Cairo", "图形学", "教程"]
categories: ["编程", "图形图像"]
---

## Cairo图形库入门：用C++绘制优雅的2D矢量图形

**摘要：** 本文是一篇针对初学者的 Cairo 入门教程，将带你从零开始，学习如何使用这个强大而优雅的2D图形库，通过C++语言创建高质量的矢量图形。

### 什么是 Cairo？

Cairo 是一个开源的2D图形库，它提供了一套强大而灵活的API，用于创建高质量的**矢量图形**。与依赖像素的**位图**不同，矢量图形基于数学方程，这意味着你可以在不损失任何清晰度的情况下，任意缩放、旋转或变换图形。

**为什么选择 Cairo？**

*   **高质量输出**：无论是生成用于打印的 PDF，还是用于网页的 SVG，Cairo 都能确保图形边缘平滑、无锯齿。
*   **多格式支持**：一次编写，多处渲染。Cairo 支持多种输出目标（称为 “Surface”），包括 PNG 图片、PDF、SVG、PostScript，甚至直接渲染到窗口。
*   **跨平台**：作为业界标准之一，Cairo 在 Linux、macOS 和 Windows 上都能完美运行。
*   **丰富的语言绑定**：虽然核心库用 C 语言编写，但它拥有 C++、Python、Rust、Go 等多种语言的绑定，让你可以在自己喜欢的开发环境中使用。

### 安装与配置

在开始之前，你需要安装 Cairo 的开发库。

**在 Linux (Ubuntu/Debian) 上：**

```bash
sudo apt-get install libcairo2-dev
```

**在 macOS 上 (使用 Homebrew)：**

```bash
brew install cairo
```

**在 Windows 上 (使用 vcpkg)：**

```bash
vcpkg install cairo
```

安装完成后，你需要告诉编译器如何找到 Cairo 的头文件和库。`pkg-config` 是一个能帮你自动完成这项工作的利器：

```bash
# 这条命令会输出编译和链接所需的全部参数
g++ your_program.cpp -o your_program `pkg-config --cflags --libs cairo`
```

### Cairo 的核心概念

理解 Cairo 的绘图模型是掌握它的关键。想象你是一位画家：

*   **Surface (画布)**：这是你的绘画目标。它可以是一张 PNG 图片 (`cairo_image_surface_create`)，一个 PDF 文件 (`cairo_pdf_surface_create`)，或是一个 SVG 图像 (`cairo_svg_surface_create`)。
*   **Context (画笔和调色板)**：`cairo_t` 是你的绘图上下文，它包含了所有绘图的状态，如颜色、线宽、字体等。你所有的绘图操作都是通过它来完成的。
*   **Path (路径)**：这是你下笔前勾勒的轮廓。路径由直线、曲线和弧线组成。它本身是不可见的，直到你进行下一步操作。
*   **Source (颜料)**：这是你用来填充或描画路径的“颜料”。它可以是纯色 (`cairo_set_source_rgb`)、渐变或图案。
*   **操作 (绘制动作)**：
    *   `cairo_stroke()`：描边，沿着路径画出轮廓线。
    *   `cairo_fill()`：填充，将路径包围的区域填满颜色。

### 第一个程序：绘制基本图形

让我们从一个简单的例子开始，创建一个PNG图片，并在上面绘制一些基本图形。这个例子将涵盖创建画布、设置画笔、定义路径和渲染的全过程。

```cpp
#include <cairo/cairo.h>
#include <cmath> // For M_PI

int main() {
    int width = 600;
    int height = 400;

    // 1. 创建一个图像画布 (Image Surface)
    cairo_surface_t* surface = cairo_image_surface_create(CAIRO_FORMAT_ARGB32, width, height);
    // 2. 创建一个绘图上下文 (Context)
    cairo_t* cr = cairo_create(surface);

    // --- 绘制背景 ---
    cairo_set_source_rgb(cr, 0.9, 0.9, 0.9); // 设置浅灰色
    cairo_paint(cr);

    // --- 绘制一个红色描边的矩形 ---
    cairo_set_source_rgb(cr, 1.0, 0.0, 0.0); // 红色
    cairo_set_line_width(cr, 6.0);
    cairo_rectangle(cr, 50, 50, 200, 150); // 定义矩形路径 (x, y, w, h)
    cairo_stroke(cr); // 描边

    // --- 绘制一个蓝色填充的圆形 ---
    cairo_set_source_rgb(cr, 0.0, 0.0, 1.0); // 蓝色
    // 定义圆形路径 (cx, cy, radius, start_angle, end_angle)
    cairo_arc(cr, 400, 125, 75, 0, 2 * M_PI);
    cairo_fill(cr); // 填充

    // --- 绘制一段绿色曲线 ---
    cairo_set_source_rgb(cr, 0.0, 1.0, 0.0); // 绿色
    cairo_set_line_width(cr, 8.0);
    cairo_move_to(cr, 50, 300); // 将画笔移动到起点
    // 定义贝塞尔曲线 (c1x, c1y, c2x, c2y, endx, endy)
    cairo_curve_to(cr, 150, 200, 350, 400, 500, 300);
    cairo_stroke(cr);

    // 3. 将结果保存到PNG文件
    cairo_surface_write_to_png(surface, "basic_shapes.png");

    // 4. 清理资源
    cairo_destroy(cr);
    cairo_surface_destroy(surface);

    return 0;
}
```

**编译并运行：**

```bash
g++ main.cpp -o basic_shapes `pkg-config --cflags --libs cairo`
./basic_shapes
```

你将得到一个名为 `basic_shapes.png` 的文件，其中包含了我们刚刚绘制的图形。

### 进阶技巧

#### 图形变换：平移、旋转与缩放

Cairo 的一个强大之处在于其坐标变换系统。你可以移动、旋转或缩放整个坐标系，从而轻松地绘制复杂的重复性图案或对齐对象。

*   `cairo_translate(cr, tx, ty)`: 将坐标系的原点 (0,0) 移动到 (tx, ty)。
*   `cairo_rotate(cr, angle)`: 将坐标系旋转指定的角度（以弧度为单位）。
*   `cairo_scale(cr, sx, sy)`: 分别在 x 和 y 轴上缩放坐标系。

一个重要的实践是使用 `cairo_save(cr)` 和 `cairo_restore(cr)` 来包裹变换操作，这就像在 Photoshop 中创建和销毁图层一样，可以确保变换效果不会影响到后续的绘图。

```cpp
// ... 在之前的代码中添加 ...

cairo_save(cr); // 保存当前状态

// 将坐标系移到画布中心
cairo_translate(cr, width / 2.0, height / 2.0);
// 旋转45度
cairo_rotate(cr, 45 * M_PI / 180.0);

// 在旋转后的坐标系中心绘制一个正方形
cairo_set_source_rgba(cr, 0.5, 0.0, 0.5, 0.5); // 半透明紫色
cairo_rectangle(cr, -50, -50, 100, 100);
cairo_fill(cr);

cairo_restore(cr); // 恢复到保存前的状态

// ... 继续其他绘图 ...
```

#### 渲染文本

Cairo 提供了强大的文本渲染功能。

```cpp
// ...
cairo_select_font_face(cr, "Sans", CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_BOLD);
cairo_set_font_size(cr, 50.0);
cairo_set_source_rgb(cr, 0.2, 0.2, 0.2);
cairo_move_to(cr, 150, 250);
cairo_show_text(cr, "Hello, Cairo!");
// ...
```

### 实际应用示例：绘制一个简单的房子场景

让我们把学到的知识结合起来，绘制一个包含房子、太阳和文字的场景。

```cpp
#include <cairo/cairo.h>
#include <cmath>

int main() {
    cairo_surface_t* surface = cairo_image_surface_create(CAIRO_FORMAT_ARGB32, 600, 400);
    cairo_t* cr = cairo_create(surface);

    // 背景
    cairo_set_source_rgb(cr, 0.8, 0.9, 1.0); // 淡蓝色天空
    cairo_paint(cr);

    // 太阳
    cairo_set_source_rgb(cr, 1.0, 0.9, 0.0); // 黄色
    cairo_arc(cr, 500, 80, 50, 0, 2 * M_PI);
    cairo_fill(cr);

    // 房子主体
    cairo_set_source_rgb(cr, 0.8, 0.7, 0.6);
    cairo_rectangle(cr, 100, 200, 200, 150);
    cairo_fill_preserve(cr); // 填充并保留路径用于描边
    cairo_set_source_rgb(cr, 0.1, 0.1, 0.1);
    cairo_set_line_width(cr, 4.0);
    cairo_stroke(cr);

    // 房顶
    cairo_move_to(cr, 80, 200);
    cairo_line_to(cr, 200, 120);
    cairo_line_to(cr, 320, 200);
    cairo_close_path(cr); // 闭合路径形成三角形
    cairo_set_source_rgb(cr, 0.9, 0.3, 0.2);
    cairo_fill_preserve(cr);
    cairo_set_source_rgb(cr, 0.1, 0.1, 0.1);
    cairo_stroke(cr);

    // 门
    cairo_rectangle(cr, 180, 280, 40, 70);
    cairo_set_source_rgb(cr, 0.5, 0.3, 0.1);
    cairo_fill(cr);

    // 欢迎语
    cairo_select_font_face(cr, "Georgia", CAIRO_FONT_SLANT_ITALIC, CAIRO_FONT_WEIGHT_NORMAL);
    cairo_set_font_size(cr, 24.0);
    cairo_set_source_rgb(cr, 0.1, 0.1, 0.1);
    cairo_move_to(cr, 120, 380);
    cairo_show_text(cr, "Welcome to Cairo!");

    // 保存并清理
    cairo_surface_write_to_png(surface, "house_scene.png");
    cairo_destroy(cr);
    cairo_surface_destroy(surface);

    return 0;
}
```

### 结论与后续学习

通过本教程，你已经掌握了使用 Cairo 进行 2D 矢量绘图的基本流程。Cairo 的强大远不止于此，你可以进一步探索：

*   **渐变与图案**：创建更丰富的视觉效果。
*   **高级路径操作**：如 `cairo_clip`，用于创建遮罩效果。
*   **不同的 Surface**：尝试将你的绘图输出为 PDF (`cairo_pdf_surface_create`) 或 SVG (`cairo_svg_surface_create`)。
*   **交互式应用**：将 Cairo 与 GTK、Qt 或其他 GUI 框架结合，创建带有动态图形的桌面应用。

要深入学习，最好的资源永远是**官方文档**和**示例**。现在，开始你的创作之旅吧！