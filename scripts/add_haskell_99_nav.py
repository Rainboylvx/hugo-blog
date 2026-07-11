#!/usr/bin/env python3
"""
为 Haskell 99 题每个 pNN.md 添加上一题/下一题导航链接（纯 Markdown）。
"""

import os

BASE_DIR = "/home/rainboy/mycode/hugo-blog/content/program_language/haskell-99"

TITLES = {
    1:  "取列表最后一个元素",
    2:  "取列表倒数第二个元素",
    3:  "取列表第 k 个元素",
    4:  "求列表长度",
    5:  "反转列表",
    6:  "判断回文",
    7:  "展平嵌套列表",
    8:  "去除连续重复元素",
    9:  "将连续重复元素打包成子列表",
    10: "游程编码",
    11: "改进的游程编码",
    12: "解码游程编码",
    13: "直接实现游程编码",
    14: "复制每个元素",
    15: "每个元素重复 N 次",
    16: "每隔 N 个删除一个元素",
    17: "在 N 处切分列表",
    18: "提取子列表",
    19: "旋转列表 N 位",
    20: "删除第 k 个元素",
    21: "在指定位置插入元素",
    22: "生成整数范围",
    23: "从列表随机选 N 个元素",
    24: "从 1..M 中随机选 N 个不同数",
    25: "随机排列列表",
    26: "生成所有 N 选 K 的组合",
    27: "互斥分组",
    28: "按子列表长度排序",
    29: "斐波那契数列",
    30: "矩阵快速幂求斐波那契",
    31: "判断素数",
    32: "最大公约数",
    33: "互质判断",
    34: "欧拉函数 φ(n)",
    35: "质因数分解",
    36: "质因数分解（含重数）",
    37: "欧拉乘积公式求 φ(n)",
    38: "高 totient 数",
    39: "区间内素数列表",
    40: "无限素数列表",
    41: "哥德巴赫猜想",
    42: "哥德巴赫猜想列表",
    43: "模逆元",
    44: "高斯整数整除",
    45: "高斯素数",
    46: "逻辑表达式真值表",
    47: "通用逻辑门",
    48: "n 元布尔函数真值表",
    49: "格雷码",
    50: "霍夫曼编码",
    51: "纠错码",
    52: "合取范式",
    53: "归结原理",
    54: "二叉树定义",
    55: "构造完全平衡二叉树",
    56: "对称二叉树",
    57: "二叉搜索树",
    58: "对称且完全平衡的二叉树",
    59: "构造高度平衡二叉树",
    60: "给定节点数的高度平衡二叉树",
    61: "收集二叉树的叶子节点",
    62: "收集二叉树指定层的节点",
    63: "构造完全二叉树",
    64: "二叉树布局：中序排列",
    65: "二叉树布局：层级等距",
    66: "二叉树布局：紧凑排列",
    67: "二叉树的字符串表示",
    68: "二叉树的中序和前序序列",
    69: "二叉树的点串表示",
    70: "从节点字符串构造树",
    71: "树的内部路径长度",
    72: "树的后序遍历",
    73: "树的 S 表达式表示",
    74: "不用 do 记法的 IO monad",
    75: "Maybe monad",
    76: "Either monad",
    77: "List monad",
    78: "Collatz 猜想",
    79: "后缀表达式",
    80: "图的表示转换",
    81: "两点间所有路径",
    82: "包含指定顶点的环",
    83: "构造生成树",
    84: "构造最小生成树",
    85: "图同构",
    86: "图着色",
    87: "深度优先遍历",
    88: "连通分量",
    89: "二分图",
    90: "n 皇后问题",
    91: "骑士巡游",
    92: "优雅树标记",
    93: "算术谜题",
    94: "正则图",
    95: "英文数字单词",
    96: "语法检查",
    97: "数独",
    98: "数织游戏",
    99: "填字游戏",
}


def add_navigation(filepath, num):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 跳过已有导航的
    if "←" in content and "→" in content and "p" in content:
        # 粗略检查：文件尾部有导航链接样式
        tail = content.strip()[-200:]
        if "← P" in tail and "→" in tail:
            print(f"  ⏭️  Skipped p{num:02d}")
            return

    # 构建导航行
    parts = []
    if num > 1:
        prev_title = TITLES[num - 1]
        parts.append(f"[← P{num-1:02d} {prev_title}](./p{num-1:02d})")
    if 1 < num < 99:
        parts.append("|")
    if num < 99:
        next_title = TITLES[num + 1]
        parts.append(f"[P{num+1:02d} {next_title} →](./p{num+1:02d})")

    nav_line = " ".join(parts)
    nav_block = f"\n---\n\n{nav_line}\n"

    content = content.rstrip() + nav_block
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✅ p{num:02d}")


def main():
    for num in range(1, 100):
        filepath = f"{BASE_DIR}/p{num:02d}.md"
        add_navigation(filepath, num)
    print(f"\n🎉 Done")


if __name__ == "__main__":
    main()
