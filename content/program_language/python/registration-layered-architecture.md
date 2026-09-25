---
title: "从课程报名例子理解 Python 四层架构"
date: 2026-09-25
draft: true
toc: true
tags: ["Python", "架构设计", "依赖注入", "FastAPI"]
---

一个课程报名接口，通常要干这几件事：读取学生、读取课程、判断有没有重复报名、看看课程满没满，最后把报名记录写进数据库。

在快速迭代时，我们往往会把这些步骤一股脑全塞进一个 HTTP 路由函数里。这确实能很快跑起来，但随着需求增加，业务规则、数据库 SQL 和 HTTP 状态码全都会死死地缠绕在一起（俗称“面条代码”）。以后无论是想加个规则、换个数据库，还是仅仅想写个独立的单元测试，都会变得异常痛苦。

本文以 [Hucci写代码的《5 分钟学会写架构设计》视频](https://www.bilibili.com/video/BV1CXet6gE6X)及同主题笔记中的报名例子为线索，写出一个可运行的 Python 版本。我们将重点探讨：**在优秀的架构中，每段代码究竟该负责什么？谁可以调用谁？**

## 面条代码的痛点在哪里？

下面是常见的“一锅炖”写法示意（省略了建表与连接管理）：

```python
@app.post("/enrollments")
def enroll(request):
    student = db.execute("SELECT ... FROM students WHERE id = ?", ...)
    course = db.execute("SELECT ... FROM courses WHERE id = ?", ...)
    if student is None or course is None:
        raise HTTPException(404, "不存在")
    if db.execute("SELECT ... FROM enrollments WHERE ...", ...):
        raise HTTPException(409, "重复报名")
    db.execute("INSERT INTO enrollments ...", ...)
    return {"ok": True}
```

这段代码的问题不在于行数，而在于它**同时承担了三种可能发生的变化**：

1. **协议变了**：如果你想把 HTTP 接口改成 gRPC 或者 Kafka 消息消费，这段代码就废了。
2. **存储变了**：如果你想把数据库从 SQLite 换成 MySQL 或 Redis，这段代码也得大改。
3. **规则变了**：哪怕只是加一个“VIP学生免排队”的规则，你也得在一堆 SQL 和 HTTP 状态码中小心翼翼地修改。

变化相互牵连，这就是代码越来越难改的根本原因。

## 用“开餐厅”的直觉理解四层架构

把所有逻辑写在一个函数里，就像一家餐厅里，服务员不仅要负责在前台点单，还要自己跑到后厨切菜、炒菜，最后还要去仓库盘点食材。一旦客人多了或换个菜系，餐厅直接崩溃。

因此，我们需要将系统分层。分层有两层核心原则：

1. **职责单一**：每层只干自己该干的事。
2. **依赖方向：让容易变化的层，依赖不容易变化的层。**

这第二条尤其重要，也是整篇文章想讲透的一句话。一段代码的变化频率是天生不同的：

- `api` 变化最频繁：HTTP 状态码、请求/响应格式、接口路径，三天两头就可能调整；
- `service` 次之：报名流程的先后步骤偶尔会变；
- `db` 的实现也可能变：今天 SQLite，明天可能换成 PostgreSQL；
- `domain` 最稳定：学生、课程这些概念，以及“不能重复报名、不能超额”这些规则，是业务的地基，很少变动。

如果让稳定的层去依赖易变的层（比如 `domain` 里 `import` 了某个 HTTP 框架），那么 HTTP 一改，核心规则就得跟着改，系统就会被反复拖累。反过来，让易变的层（`api`）去依赖稳定的层（`service`、`domain`），不管外面怎么翻腾，内部地基都稳如泰山。

> [!IMPORTANT] 核心原则
> **让容易变化的层，依赖不容易变化的层。** 箭头永远指向更稳定的地方。

在这个 Python 项目中，我们将代码按职责拆分为四层，你可以这样直观地理解它们：

- **`domain` (领域层) —— “后厨的大厨与核心菜谱”**
  - **作用**：封装最核心的业务概念（学生、课程）和死磕业务规则（不存在、重复报名、满员）。
  - **铁律**：它是系统的绝对内层，纯纯的 Python 代码，**不能**有任何 SQL，**不能**有任何 HTTP 框架的导入。这使得它可以在不连数据库的情况下，1 毫秒内跑完几千个单元测试。

- **`service` (服务层) —— “大堂经理”**
  - **作用**：编排业务流程。他知道整个报名的先后步骤（查人 -> 查课 -> 校验规则 -> 存入数据库），但他自己不干苦力。他向 `db` 拿数据，交给 `domain` 校验，再让 `db` 保存。
  - **铁律**：他不直接依赖具体的数据库类，而是**声明**自己需要一个“仓管员”（`EnrollmentStore` 接口）。这样，底层怎么换数据库，经理根本不关心。

- **`db` (数据存取层) —— “仓库管理员”**
  - **作用**：负责与数据库进行真实的物理交互。写 SQL、建连接、做事务。
  - **铁律**：只管按 `service` 的要求存取数据，绝不擅自做主去校验“业务规则”，也不操心 HTTP 怎么返回。

- **`api` (接口层 / 表现层) —— “前台接待”**
  - **作用**：站在最外面接客。接收外部 HTTP 请求，转交给 `service` 去干活，然后把结果或错误翻译成 200、404 状态码返回给客户。同时，它是系统的**装配点**（它负责把具体的 DB 实例指派给 Service）。
  - **铁律**：路由函数里绝对不写任何核心业务判断和 SQL。

它们之间的调用链非常清晰：**`HTTP 请求 → api → service → domain`**。
箭头指向的地方就是被依赖的地方，也是更稳定、更不容易变化的地方。越往内层，代码越稳定、越纯粹——这正是“让容易变化的层，依赖不容易变化的层”的直观体现。

把依赖关系画出来就是这样：

```text
           变化频繁（外层）────────────────────────► 变化缓慢（内层）

   HTTP 请求
       │
       ▼
  ┌────────┐      ┌─────────┐      ┌────────┐
  │   api  │ ───► │ service │ ───► │ domain │
  │ 前台接待 │      │ 大堂经理  │      │ 大厨/规则 │
  └────────┘      └────┬────┘      └────────┘
                       │
                       │ 依赖（声明“我需要这些存储能力”）
                       ▼
               ┌─────────────────┐
               │ EnrollmentStore │  ← 存储接口（岗位说明书）
               └────────▲────────┘
                        │ 实现（满足接口要求）
                        │
                   ┌────┴────┐
                   │   db    │
                   │ 仓库管理员 │
                   └─────────┘
```

从图里能看出两件事：

1. **实线箭头永远指向更稳定的内层**：`api` 依赖 `service`，`service` 依赖 `domain`，谁变化频繁谁站在外侧、去依赖里面更稳的。
2. **`service` 依赖的是“接口”而不是 `db` 本身**：`service` 只认 `EnrollmentStore` 这份“岗位说明书”，而 `db` 主动去实现它。箭头的方向，决定了换掉 `db`（比如 SQLite 换 PostgreSQL）时，`service` 一行都不用改。

> **注意：如何理解依赖倒置？**
> 
> 在运行时，大堂经理（`service`）确实是指挥仓库管理员（具体的 SQLite 数据库对象）干活的。但在**代码编写**上，经理只看“岗位说明书”（自己定义的 `EnrollmentStore` 接口）。只要 SQLite 类通过 Python 的 `Protocol` 类型满足了这个岗位的要求，经理就能用它。这样一来，经理的代码里完全没有 `import sqlite3`，这就是依赖倒置。

## 写一个能运行的报名例子

使用 Python 3.10+，创建下面的目录。代码也保存在本文所在目录的 `src/registration_layers/` 中；下文每一段代码都可直接复制到对应文件。

```text
registration_demo/
├── registration_layers/
│   ├── __init__.py
│   ├── domain.py
│   ├── service.py
│   ├── db.py
│   └── api.py
└── .venv/                 # 安装依赖后生成
```

### 1. domain：把规则写成普通 Python

`check_enrollment` 只接收数据和当前状态。无需连接数据库，也无需构造 HTTP 请求，就能验证各种边界情况。

{{< include "src/registration_layers/domain.py" "python" >}}

规则失败时抛出明确的异常；“学生不存在”和“课程已满”不会再被笼统的 `False` 混在一起。`domain` 不导入 FastAPI 或 `sqlite3`，所以它是相对稳定的内层。

### 2. service：编排报名流程，声明存储需求

服务负责按顺序读学生、读课程、查重复与人数，然后调用领域规则，最后保存。`EnrollmentStore` 列出服务真正需要的五个操作。

{{< include "src/registration_layers/service.py" "python" >}}

测试这个服务时，可以给它传入一个内存实现；业务规则改变时，主要修改 `domain`；报名步骤改变时，主要修改 `service`。接口的意义不是把每个类都包装一次，而是让服务的存储需求具体、可替换。

### 3. db：实现这些存储操作

SQLite 版本负责建表、参数化查询与插入。示例启动时用 `INSERT OR IGNORE` 准备学生 `1` 和课程 `1`，课程容量为 `2`。

{{< include "src/registration_layers/db.py" "python" >}}

`enrollments` 表使用 `(student_id, course_id)` 作为主键。即使另一请求在“检查重复”和“插入”之间抢先写入，数据库仍会拒绝重复记录；适配器将这类冲突转换成领域异常。

这里还有一个刻意保留的边界：**容量检查与插入没有放进同一事务**。两个学生同时报名最后一个名额时，都可能看到“还剩一席”，最终超额。这个例子用于学习分层，不能直接当作高并发报名系统。实际系统应把人数检查和写入放进同一个受数据库锁或其他并发控制保护的事务，并对冲突做重试或明确返回。

### 4. api：映射 HTTP，并在外层装配

API 只把请求交给服务，再把可预期的失败映射到 `404` 或 `409`。创建数据库适配器、创建服务、把二者连接起来的几行，就是**装配点**。

{{< include "src/registration_layers/api.py" "python" >}}

如果以后换成 PostgreSQL，主要工作是实现同一组存储操作，并在装配点把新实例传给 `EnrollmentService`。数据库迁移、事务语义和并发控制仍要认真处理；依赖注入只减少上层代码对某一种存储技术的绑定。

## 本地运行与验证

在 `registration_demo` 目录执行：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install "fastapi[standard]"
python -m uvicorn registration_layers.api:app --reload
```

另开终端发送第一次报名请求：

```bash
curl -i -X POST http://127.0.0.1:8000/enrollments \
  -H 'Content-Type: application/json' \
  -d '{"student_id":1,"course_id":1}'
```

预期得到 `201 Created` 和 `{"student_id":1,"course_id":1}`。原样再请求一次，预期得到 `409 Conflict` 与“已报名”；把 `student_id` 改成 `999`，预期得到 `404 Not Found`。删除当前目录下的 `enrollment.db` 可以重置演示数据。

不启动 Web 服务也能直接检查核心规则：

```bash
python - <<'PY'
from registration_layers.domain import (
    AlreadyEnrolled, Course, CourseFull, Student, check_enrollment,
)

student = Student(1, "小明")
course = Course(1, "Python 入门", 2)
check_enrollment(student, course, False, 1)  # 允许报名

for error, enrolled, count in [
    (AlreadyEnrolled, True, 1),
    (CourseFull, False, 2),
]:
    try:
        check_enrollment(student, course, enrolled, count)
    except error:
        print(error.__name__, "验证通过")
PY
```

这正是分层的直接收益：规则测试不需要 HTTP 和数据库；要测试流程，可以传入一个实现了 `EnrollmentStore` 五个方法的内存对象；要验证数据库，再单独连接 SQLite。

## 什么时候值得这样拆

如果只有一个很短、不会变化的脚本，分四层会增加文件和跳转成本。报名流程有多条规则、可能换 Web 框架或数据库、需要独立测试时，这种拆分才开始回本。判断标准不是“文件是否足够多”，而是每次需求变化能否找到主要修改位置，并且内层规则能否脱离外部工具运行。

参考：[原视频](https://www.bilibili.com/video/BV1CXet6gE6X)；[FastAPI 官方入门](https://fastapi.tiangolo.com/tutorial/)；[Python `sqlite3` 文档](https://docs.python.org/3/library/sqlite3.html)。
