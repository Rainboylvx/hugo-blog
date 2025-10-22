---
title: vscode-markdown不能使用snippets的问题
date: 2025-09-19
toc: true
---

打开用户的setting.json，

加入下面的配置：

```
    // markdown不显示代码块的问题
	"[markdown]":  {
		"editor.quickSuggestions": {
				"other": "on"
		}
	},
```


不生效的原因：

这个"other"项的配置，默认值是'off'