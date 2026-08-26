---
title: "用 Node.js 操作 NocoDB API：从增删改查到比赛数据 Upsert"
date: 2026-08-26
lastmod: 2026-08-26
draft: false
toc: true
tags: ["Node.js", "NocoDB", "API"]
---

NocoDB 的网页适合人工录入和查看数据，API 则适合让程序自动读写数据。本文以一个简单的 `tasks` 表开始，依次完成查询、新增、修改和删除，最后把这些操作组合成实际使用过的“洛谷比赛同步”逻辑。

本文使用 NocoDB v2 Data API 和 Node.js 20+ 自带的 `fetch`。完整请求地址具有下面的形式：

```text
http://localhost:8080/api/v2/tables/<TABLE_ID>/records
```

只需要先记住三个值：

| 配置 | 示例 | 作用 |
|---|---|---|
| `NOCODB_BASE_URL` | `http://localhost:8080` | NocoDB 服务地址 |
| `NOCODB_TABLE_ID` | `mxxxxxxxxxxxxxx` | 要操作的表 |
| `NOCODB_TOKEN` | `nc_pat_xxxxxxxxx` | 证明程序有权访问这张表 |

## 准备 tasks 表和访问凭据

在 NocoDB 中新建一张 `tasks` 表。`Id` 是 NocoDB 自动创建的系统字段，再添加下面四列：

| 字段 | NocoDB 类型 | 示例 |
|---|---|---|
| `Title` | 单行文本 | `整理比赛数据` |
| `Done` | 勾选 | `false` |
| `Priority` | 数字 | `3` |
| `DueAt` | 日期时间 | `2026-08-30T12:00:00.000Z` |

打开这张表的 **Data APIs** 或 **API Snippets** 页面，从生成的请求地址中复制 Table ID。不要把表在网页中显示的名字当成 Table ID；它通常是一串类似 `mxxxxxxxxxxxxxx` 的内部标识。

然后在 NocoDB 的账户设置中创建 API Token。菜单名称可能随版本变化，一般位于 **Account Settings -> Tokens**。Token 会继承创建者的权限：本文需要写入数据，因此应使用只对目标 Base 有必要写权限的独立账号，不要使用 Owner 账号的 Token。只读程序则给 Viewer 权限即可。

把配置放进 `.env`：

```dotenv
NOCODB_BASE_URL=http://localhost:8080
NOCODB_TABLE_ID=mxxxxxxxxxxxxxx
NOCODB_TOKEN=nc_pat_xxxxxxxxxxxxxxxxx
```

同时把 `.env` 加入 `.gitignore`，不要把真实 Token 提交到 Git：

```gitignore
.env
```

> [!WARNING] Token 只能放在服务端脚本中
> 不要把 `xc-token` 写入浏览器端 JavaScript。浏览器会把它暴露给每一位访问者。

## 第一次查询：先看见完整请求

先不封装函数，直接写一个最小的 `list.js`：

```js
async function main() {
  const baseUrl = process.env.NOCODB_BASE_URL;
  const tableId = process.env.NOCODB_TABLE_ID;
  const token = process.env.NOCODB_TOKEN;

  const url = new URL(`/api/v2/tables/${tableId}/records`, baseUrl);
  url.searchParams.set('fields', 'Id,Title,Done,Priority,DueAt');
  url.searchParams.set('limit', '10');

  const response = await fetch(url, {
    headers: {
      'xc-token': token,
    },
  });

  if (!response.ok) {
    throw new Error(`NocoDB 返回 ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  console.table(result.list);
  console.log('分页信息：', result.pageInfo);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

运行它：

```sh
node --env-file=.env list.js
```

这里最值得注意的是返回值。查询接口返回的不是记录数组本身，而是一个对象：

```json
{
  "list": [
    {
      "Id": 1,
      "Title": "整理比赛数据",
      "Done": false,
      "Priority": 3,
      "DueAt": "2026-08-30 20:00:00+08:00"
    }
  ],
  "pageInfo": {
    "totalRows": 1,
    "page": 1,
    "pageSize": 10,
    "isFirstPage": true,
    "isLastPage": true
  }
}
```

- `result.list` 才是记录数组。
- `result.pageInfo` 描述分页状态。
- `fields` 限制返回列，既减少传输数据，也让代码明确依赖哪些字段。
- `xc-token` 是 NocoDB v2 API 使用的认证请求头。

`fetch` 遇到 `401`、`404` 或 `500` 时不会自动抛出异常，因此每次都要检查 `response.ok`。这是后面封装公共函数的主要原因。

## 封装公共 NocoDB 客户端

新增 `nocodb-client.js`，集中处理地址、Token、JSON 和错误。后面的业务脚本只需表达“我要查什么”或“我要写什么”。

```js
const requiredEnv = [
  'NOCODB_BASE_URL',
  'NOCODB_TABLE_ID',
  'NOCODB_TOKEN',
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`缺少环境变量 ${name}`);
  }
}

const baseUrl = process.env.NOCODB_BASE_URL;
const tableId = process.env.NOCODB_TABLE_ID;
const token = process.env.NOCODB_TOKEN;
const recordsUrl = new URL(
  `/api/v2/tables/${encodeURIComponent(tableId)}/records`,
  baseUrl,
);

async function request({ method = 'GET', query = {}, body } = {}) {
  const url = new URL(recordsUrl);

  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(name, String(value));
    }
  }

  const options = {
    method,
    headers: {
      'xc-token': token,
    },
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (cause) {
    throw new Error(`无法连接 NocoDB：${cause.message}`, { cause });
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`NocoDB ${method} ${response.status}: ${detail}`);
  }

  return data;
}

function listRecords(query) {
  return request({ query });
}

function createRecord(record) {
  return request({ method: 'POST', body: record });
}

function updateRecord(record) {
  return request({ method: 'PATCH', body: record });
}

function deleteRecord(id) {
  return request({ method: 'DELETE', body: { Id: id } });
}

module.exports = {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
};
```

这段封装做了四件事：

1. 启动时检查三个必要配置，避免把 `undefined` 拼进请求地址。
2. 通过 `URLSearchParams` 自动编码查询参数。
3. 写入时把 JavaScript 对象转换为 JSON。
4. 无论 NocoDB 返回 JSON 还是纯文本错误，都尽量保留详细信息。

## 查询：过滤、排序和分页

把 `list.js` 改成使用公共客户端：

```js
const { listRecords } = require('./nocodb-client');

async function main() {
  const result = await listRecords({
    fields: 'Id,Title,Done,Priority,DueAt',
    where: '(Done,eq,false)',
    sort: '-Priority,DueAt',
    limit: 20,
    offset: 0,
  });

  console.table(result.list);
  console.log('总记录数：', result.pageInfo.totalRows);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

查询参数可以组合使用：

| 参数 | 示例 | 含义 |
|---|---|---|
| `fields` | `Id,Title,Done` | 只返回指定字段 |
| `where` | `(Done,eq,false)` | 只查询未完成任务 |
| `sort` | `-Priority,DueAt` | 优先级降序，再按截止时间升序 |
| `limit` | `20` | 本次最多返回 20 条 |
| `offset` | `0` | 跳过前面的记录数 |

`where` 是 NocoDB 的过滤表达式，基本形状是：

```text
(字段,比较操作,值)
```

例如：

```text
(Priority,gte,3)
(Done,eq,false)
((Done,eq,false)~and(Priority,gte,3))
```

不要再对 `where` 手动调用 `encodeURIComponent()`。客户端中的 `url.searchParams.set()` 已经完成 URL 编码，再编码一次会导致 NocoDB 无法识别条件。

## 新增记录

`create.js` 创建一条任务：

```js
const { createRecord } = require('./nocodb-client');

async function main() {
  const created = await createRecord({
    Title: '整理洛谷比赛数据',
    Done: false,
    Priority: 3,
    DueAt: new Date('2026-08-30T20:00:00+08:00').toISOString(),
  });

  console.log('创建成功：', created);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

```sh
node --env-file=.env create.js
```

传给 `createRecord()` 的对象，其属性名必须与 NocoDB 的字段名一致。字段类型也要匹配：勾选字段使用布尔值 `true`/`false`，数字字段不要传成带文字的字符串。

日期使用带时区的输入，再调用 `toISOString()` 转为标准 UTC 时间。上面的 `20:00 +08:00` 会被发送为 `12:00Z`，两者表示同一个时刻，并不是时间少了八小时。

## 修改记录

NocoDB 使用系统字段 `Id` 确定要修改哪条记录。`update.js` 从命令行接收这个 Id：

```js
const { updateRecord } = require('./nocodb-client');

async function main() {
  const id = Number(process.argv[2]);
  if (!Number.isInteger(id)) {
    throw new Error('请提供要修改的数字 Id，例如：node update.js 12');
  }

  const updated = await updateRecord({
    Id: id,
    Done: true,
  });

  console.log('修改成功：', updated);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

```sh
node --env-file=.env update.js 12
```

PATCH 只修改传入的字段。这里不会改变 `Title`、`Priority` 和 `DueAt`。注意，`Id` 是 NocoDB 的记录主键，不是后面比赛数据里的业务字段 `cid`。

## 删除记录

`delete.js` 同样从命令行接收 Id：

```js
const { deleteRecord } = require('./nocodb-client');

async function main() {
  const id = Number(process.argv[2]);
  if (!Number.isInteger(id)) {
    throw new Error('请提供要删除的数字 Id，例如：node delete.js 12');
  }

  await deleteRecord(id);
  console.log(`已删除记录 ${id}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

```sh
node --env-file=.env delete.js 12
```

删除通常不可恢复。先用查询确认 Id，并且只用自己刚创建的测试记录练习。如果你的 NocoDB 版本在 API Snippets 中给出的 DELETE 请求体是数组，就把公共客户端中的删除函数改为 `body: [{ Id: id }]`；以当前服务器自动生成的 API 文档为准。

到这里，四种操作和请求方法的对应关系已经很清楚：

| 目的 | 客户端函数 | 请求方法 |
|---|---|---|
| 查询 | `listRecords()` | GET |
| 新增 | `createRecord()` | POST |
| 修改 | `updateRecord()` | PATCH |
| 删除 | `deleteRecord()` | DELETE |

## 实战：按 cid 同步洛谷比赛

现在换成真实场景。NocoDB 的 `contest` 表包含：

| 字段 | 类型 | 用途 |
|---|---|---|
| `cid` | 数字，唯一 | 洛谷比赛 ID，也是业务唯一键 |
| `name` | 单行文本 | 比赛名称 |
| `mode` | 单行文本或单选 | 赛制 |
| `start`、`end` | 日期时间 | 开始和结束时间 |
| `rated` | 勾选 | 是否计分 |
| `host` | 单行文本 | 主办方 |
| `url` | URL | 比赛链接 |
| `notified` | 勾选 | 是否已经发送提醒 |

这一次把 `.env` 中的 `NOCODB_TABLE_ID` 换成 `contest` 表的 Table ID。

洛谷接口中的 `id` 是比赛编号，NocoDB 创建记录后还有自己的 `Id`。同步时不能直接拿 `cid` 做 PATCH，因为 NocoDB 更新接口需要的是 `Id`。正确过程是：

```text
用 cid 查询 -> 找到 NocoDB Id -> 有则 PATCH，无则 POST
```

这种“存在就更新，不存在就新增”的操作称为 **upsert**。新增 `upsert-contest.js`：

```js
const {
  listRecords,
  createRecord,
  updateRecord,
} = require('./nocodb-client');

function toRow(contest) {
  return {
    cid: Number(contest.id),
    name: contest.name,
    mode: contest.mode,
    start: new Date(contest.start * 1000).toISOString(),
    end: new Date(contest.end * 1000).toISOString(),
    rated: Boolean(contest.rated),
    host: contest.host ?? '',
    url: contest.url,
  };
}

async function upsertContest(contest) {
  const cid = Number(contest.id);
  if (!Number.isInteger(cid)) {
    throw new Error(`无效的比赛 id：${contest.id}`);
  }

  const result = await listRecords({
    where: `(cid,eq,${cid})`,
    fields: 'Id',
    limit: 1,
  });

  const row = toRow(contest);
  const existing = result.list[0];

  if (existing) {
    await updateRecord({ Id: existing.Id, ...row });
    return 'updated';
  }

  await createRecord({ ...row, notified: false });
  return 'created';
}

async function main() {
  const contest = {
    id: 352393,
    name: '示例比赛',
    mode: 'OI',
    start: 1788062400,
    end: 1788073200,
    rated: true,
    host: '示例主办方',
    url: 'https://www.luogu.com.cn/contest/352393',
  };

  const action = await upsertContest(contest);
  console.log(`比赛 ${contest.id}: ${action}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

这里有两个容易忽略的细节：

1. 更新时没有传 `notified`。已经提醒过的比赛再次同步时，不能把它重置为 `false`，否则会重复发通知。
2. `start` 和 `end` 原本是 Unix 秒，而 JavaScript 的 `Date` 接收毫秒，所以必须先乘以 `1000`。

应当在 NocoDB 中为 `cid` 添加唯一约束。当前实现是“先查再写”，两个同步任务同时运行时，可能都查到不存在并尝试新增；唯一约束至少能阻止重复数据。单实例定时任务通常足够，存在并发写入时还要捕获唯一冲突后重试更新。

## 按日期查询比赛

例如查询 2026 年 8 月 26 日 17:00（东八区）之后结束的比赛：

```js
const { listRecords } = require('./nocodb-client');

async function main() {
  const result = await listRecords({
    fields: 'cid,name,start,end,url',
    where: '(end,ge,exactDate,2026-08-26 17:00:00+08:00)',
    sort: 'end',
    limit: 50,
  });

  console.table(result.list);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

时区必须明确。`2026-08-26 17:00:00+08:00` 表示北京时间，`2026-08-26T09:00:00.000Z` 表示同一个时刻。不要传没有 `+08:00` 或 `Z` 的模糊时间，否则脚本所在机器、NocoDB 和浏览器可能做出不同解释。

## 常见错误

| 现象 | 常见原因 | 处理方式 |
|---|---|---|
| `401 Unauthorized` | Token 错误或已失效 | 重新创建 Token，检查 `.env` 是否加载 |
| `403 Forbidden` | Token 对目标 Base 没有权限 | 给服务账号最小必要权限 |
| `404 Not Found` | Table ID、地址或 API 版本错误 | 从该表的 API Snippets 重新复制地址 |
| `422 Unprocessable Entity` | 字段名、类型或过滤语法错误 | 对照表结构和响应正文检查请求数据 |
| `fetch failed` | NocoDB 不可达 | 检查端口、防火墙、容器映射和局域网地址 |
| 查询结果总是空 | 把 `Id`、`cid` 混用，或时间时区错误 | 打印最终 URL，并在 NocoDB 中核对原始值 |

调试时不要只输出“请求失败”。公共客户端会保留状态码和响应正文，这些信息通常已经明确指出哪个字段或条件有问题。同时不要把完整请求头写入日志，因为其中包含 Token。

## 为什么 Node.js 能 fetch，n8n 却可能报错

Node.js 20+ 在普通脚本中提供全局 `fetch`，所以本文代码无需安装 HTTP 库。但 n8n 的 Code 节点运行在受限制的执行环境中，是否提供全局 `fetch` 取决于 n8n 版本和任务运行器配置，因此可能出现：

```text
fetch is not defined
```

这不代表 NocoDB API 有问题，也不代表 Node.js 示例有问题，只是两段代码的运行环境不同。在 n8n 中应使用该版本明确提供的 HTTP Request 节点或请求辅助函数；不要因为普通 Node.js 支持 `fetch`，就假定所有 JavaScript 沙箱也支持。

## 最终文件结构

完成后，示例代码可以按下面的方式保存：

```text
nocodb-demo/
├── .env
├── .gitignore
├── nocodb-client.js
├── list.js
├── create.js
├── update.js
├── delete.js
└── upsert-contest.js
```

学习 NocoDB API 的关键不是记住每个参数，而是建立一条稳定思路：先从表的 API Snippets 确认地址和字段，再用一个最小 GET 验证连接，把认证和错误处理封装起来，最后让业务代码只负责数据规则。对于比赛同步，真正的业务规则就是 `cid` 唯一、时间转换正确，并且更新时保留 `notified`。
