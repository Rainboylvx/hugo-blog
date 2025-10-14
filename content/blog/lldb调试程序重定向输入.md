---
title: "lldb调试程序重定向输入"
date: 2025-10-12
draft: false
toc: true
tags: [""]
categories: [""]
---



好的，在 Mac M1 芯片上使用命令行 `lldb` 调试，并为程序指定输入文件，这需要两步关键操作：

1.  **为你的可执行文件进行代码签名** (这是 M1/M2/M3 芯片 Mac 的特殊要求)。
2.  **在 lldb 内部使用正确的命令来重定向输入**。

你不能像在 shell 里那样直接使用 `<` 符号，即 `lldb 1.out < in.txt` 是**错误**的，因为这会把 `in.txt` 的内容输入给 `lldb` 程序本身，而不是你要调试的 `1.out`。

下面是详细的步骤和解释。

-----

### 准备工作：一个示例程序

我们先创建一个简单的 C++ 程序和输入文件来进行演示。

**1. 创建源代码 `test.cpp`**
这个程序会读取一个整数和一个字符串。

```cpp
#include <iostream>
#include <string>

int main() {
    int id;
    std::string name;

    std::cout << "准备从标准输入读取数据..." << std::endl;

    // 从标准输入(stdin)读取数据
    std::cin >> id;
    std::cin >> name;

    std::cout << "读取到的 ID: " << id << std::endl;
    std::cout << "读取到的 Name: " << name << std::endl;

    return 0;
}
```

**2. 创建输入文件 `in.txt`**
文件的内容要和程序读取的格式对应。

```txt
101
Gemini
```

**3. 编译程序**
使用 `g++` 编译，并且**一定要加上 `-g` 参数**，这样才会包含调试信息，否则 lldb 看不到源代码。

```bash
g++ -g test.cpp -o 1.out
```

现在你的文件夹里应该有 `1.out` 和 `in.txt` 了。

-----

### ⚠️ 步骤一：代码签名 (M1/M2/M3 Mac 必需)

在 Apple Silicon 芯片的 Mac 上，出于安全原因，调试器 lldb 无法附加到没有经过签名的可执行文件上。你需要为 `1.out` 创建一个临时的“即席签名”(ad-hoc signature) 并赋予它调试权限。

**1. 创建一个权限描述文件 `entitlements.xml`**
在与 `1.out` 相同的目录下，创建一个名为 `entitlements.xml` 的文件，内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.get-task-allow</key>
    <true/>
</dict>
</plist>
```

这个文件里的 `com.apple.security.get-task-allow` 键设置为 `true`，就是告诉系统“允许其他进程（比如调试器）附加到这个程序上”。

**2. 使用 `codesign` 命令进行签名**
打开终端，运行以下命令：

```bash
codesign -s - --entitlements entitlements.xml --force ./1.out
```

  * `-s -`：表示使用一个临时的即席签名，不需要开发者证书。
  * `--entitlements entitlements.xml`：将上面创建的权限文件应用到程序上。
  * `--force`：强制覆盖现有的签名（如果有的话）。
  * `./1.out`：你要签名的目标文件。

执行成功后，`1.out` 就具备了被调试的资格。**每次重新编译后，都需要重新进行签名**。

-----

### 🚀 步骤二：使用 LLDB 进行调试和输入重定向

现在可以开始真正的调试了。

**1. 启动 LLDB**
在终端中，用 lldb 加载你的程序：

```bash
lldb ./1.out
```

你会看到 lldb 的提示符 `(lldb)`。

```
(lldb) target create "./1.out"
Current executable set to '/path/to/your/project/1.out' (arm64).
(lldb)
```

**2. 设置断点**
在程序开始运行前，我们先在 `main` 函数设置一个断点。

```bash
(lldb) b main
```

或者，如果你想在读取数据的那一行设置断点：

```bash
(lldb) b test.cpp:11
```

**3. 运行程序并重定向输入 (核心步骤)**
使用 `process launch` 命令（可以简写为 `run`）来启动程序，并使用 `--stdin` (或简写 `-i`) 标志来指定输入文件。

```bash
(lldb) process launch --stdin in.txt
```

或者使用简写形式：

```bash
(lldb) run -i in.txt
```

**4. 开始调试**
程序会开始运行，并在你设置的断点处停下来。

```
Process 12345 launched: '/path/to/your/project/1.out' (arm64)
...
Process 12345 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 1.1
    frame #0: 0x0000000100003e8c 1.out`main at test.cpp:7
   4   	
   5   	int main() {
   6   	    int id;
-> 7   	    std::string name;
   8   	
   9   	    std::cout << "准备从标准输入读取数据..." << std::endl;
   10  	
   11  	    // 从标准输入(stdin)读取数据
Target 0: (1.out) stopped.
(lldb)
```

现在你就可以使用 lldb 的各种命令进行调试了：

  * `n` (next): 执行下一行代码。
  * `c` (continue): 继续执行直到下一个断点或程序结束。
  * `p <variable>` (print): 打印变量的值。

当你执行过 `std::cin >> id;` 之后，可以打印 `id` 的值来验证它是否成功从 `in.txt` 中读取了数据。

```bash
(lldb) n
... (执行几步直到 cin 之后)
(lldb) p id
(int) $0 = 101
(lldb) p name
(std::string) $1 = "Gemini"
```

你会看到变量的值和 `in.txt` 文件中的内容完全一致。

### 总结

完整的流程是：

1.  `g++ -g your_code.cpp -o 1.out`  (编译)
2.  `codesign -s - --entitlements entitlements.xml --force ./1.out` (签名，仅 M1/2/3 Mac 首次或重新编译后需要)
3.  `lldb ./1.out` (启动 lldb)
4.  `(lldb) b main` (设置断点)
5.  `(lldb) run -i in.txt` (运行并重定向输入)
6.  开始你的调试之旅！