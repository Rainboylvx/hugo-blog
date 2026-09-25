---
title: "从课程报名例子理解 Python 四层架构"
date: 2026-09-25
draft: true
toc: true
tags: ["Python", "架构设计", "依赖注入", "FastAPI"]
---

一个课程报名接口需要读取学生、读取课程、判断重复报名与课程容量，最后写入报名记录。把这些步骤全放进一个 HTTP 函数，很快就能让功能跑起来；但规则、数据库操作和 HTTP 响应混在一起以后，理解、测试和修改都会变难。

本文以 [Hucci写代码的《5 分钟学会写架构设计》视频](https://www.bilibili.com/video/BV1CXet6gE6X)及同主题笔记中的报名例子为线索，写出一个可运行的 Python 版本。核心问题是：**每段代码负责什么，以及哪一层可以依赖哪一层？**

## 一个函数为什么越来越难改

下面是常见的写法示意，省略了建表与连接管理：

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

问题不在函数行数本身，而在同一个函数承担了三种变化：

| 变化 | 需要改动的内容 | 本来应该关心它的地方 |
| --- | --- | --- |
| 报名规则改变 | 比如新增“课程已满”检查 | 领域规则 |
| 数据库改变 | SQL、连接、事务 | 数据存取 |
| 对外协议改变 | HTTP 状态码、请求与响应格式 | API |

规则放在路由函数里，想单独测试就得启动 HTTP；数据库代码混在规则里，换存储实现也会碰到报名流程。拆层的第一步是按职责分开，再决定依赖方向。

## 按职责拆成四层

| 层 | 在本例中负责什么 | 不应负责什么 |
| --- | --- | --- |
| `domain` | 学生、课程概念；不存在、重复报名、满员等规则 | HTTP 状态码、SQL |
| `service` | 组织一次报名：读取、检查、保存；声明所需的存储操作 | 具体数据库连接 |
| `db` | 用 SQLite 实现读取与写入 | 决定 HTTP 返回值 |
| `api` | 接收请求，调用服务，映射 HTTP 错误；装配对象 | 实现报名规则 |

调用链是 `HTTP 请求 → api → service → domain`，而 `service` 通过自己声明的 `EnrollmentStore` 接口使用存储。启动时，最外层把 `SQLiteEnrollmentStore` 实例交给 `EnrollmentService`。因此，服务不需要知道底层是 SQLite 还是其他实现。

这里的“依赖”要分清两种：运行时，服务确实会调用数据库对象；代码引用上，服务只引用存储接口。SQLite 类通过 Python 的 `Protocol` 结构化类型满足接口，不需要继承它。

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
