---
title: learn you haskell for great good
date: 2025-09-09
noList: false
---

## 资源

![](./images/cover.jpg)


- 中文版 https://learnyouahaskell.mno2.org/zh-cn 
- 英文版 https://learnyouahaskell.com/chapters

archlinux [参考 这里](https://wiki.archlinux.org/title/Haskell) 下安装与编译

```bash
sudo pacman -S ghc
cat > 1.hs << EOF
main = putStrLn "Hello, world!"
EOF
ghc -dynamic 1.hs
./1
```

最简单的方法可以是用 在线haskell: https://play.haskell.org/

## 目录

- [Introduction](./chapter_1)
- [Starting Out](./chapter_2)