---
title: "docker-entrypoint-initdb.d 无效的排查"
date: 2026-05-18
draft: false
toc: true
tags: ["docker", "mongodb", "bug fix"]
categories: ["随笔"]
---

## 现象与配置

在本地使用 `docker-compose` 部署 MongoDB 服务时，编写了如下配置：

```yaml
services:
  mongo:
    image: mongo:latest
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: xxx
      MONGO_INITDB_ROOT_PASSWORD: xxx
      MONGO_INITDB_DATABASE: admin
    volumes:
      - ./mongo/data:/data/db
      - ./mongo/init:/docker-entrypoint-initdb.d
    ports:
      - 27017:27017
    command: mongod --auth
```

期望在容器初次启动时，自动执行挂载在 `./mongo/init/init.js` 的初始化脚本。

但执行 `docker compose up -d` 启动后，发现初始化脚本完全没有被执行，预期的数据库或用户配置并没有生效。

## 排查过程

### 1. 检查容器内挂载文件

首先怀疑是不是本地挂载路径写错，导致容器内部没有映射到文件：

```bash
docker exec -it <container_name_or_id> bash
```

进入容器后检查目录：

```bash
ls -la /docker-entrypoint-initdb.d/
```

确认文件 `init.js` 确实存在于 `/docker-entrypoint-initdb.d/` 目录下，说明文件挂载没有问题。

### 2. 查阅官方镜像说明

既然文件存在但未执行，于是去查阅 Docker Hub 上的 [MongoDB 官方镜像文档](https://hub.docker.com/_/mongo)。

文档中明确指出了该初始化机制的触发条件：

> **Initializing a fresh instance**  
> When a container is started for the first time it will execute files with extensions `.sh` and `.js` that are found in `/docker-entrypoint-initdb.d`. Files will be executed in alphabetical order. ... This will only happen if you start the container with a completely empty database directory: if the directory already contains database files, the scripts will not be run.

关键原因在于：**`/docker-entrypoint-initdb.d` 下的初始化脚本只会在 `/data/db` 是一个完全干净（为空）的目录时执行**。只要该目录下已经存在历史数据文件，容器就会认为这是一个已经初始化过的实例，从而跳过所有初始化脚本。

### 3. 验证本地数据目录

检查本地映射的主机目录 `./mongo/data/`：

```bash
ls -la ./mongo/data/
```

果然发现里面残留了不少文件，是之前测试其他命令或旧容器时生成的历史数据。

## 解决办法

清理历史数据文件并重新拉起容器：

1. 停止当前容器：
   ```bash
   docker compose down
   ```
2. 清空本地映射的数据目录：
   ```bash
   rm -rf ./mongo/data/*
   ```
3. 重新启动服务：
   ```bash
   docker compose up -d
   ```

再次查看日志与数据库，初始化脚本成功按预期执行。

> [!TIP] 总结
> 无论是 MongoDB、MySQL 还是 PostgreSQL 官方镜像，`/docker-entrypoint-initdb.d/` 的执行前提基本都是**初始化全新实例（数据目录为空）**。
> 调试这类容器初始化问题时，务必保证挂载的本地数据目录是全新且干净的。
