-- 初始化 lazy.nvim
local gitproxy = "https://gh-proxy.com/"
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = gitproxy .. "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out,                            "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

-- 在加载 lazy.nvim 之前确保设置 `mapleader` 和 `maplocalleader`，以确保映射正确。
-- 这里也是设置其他选项 (vim.opt) 的好地方
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

-- 设置 lazy.nvim
require("lazy").setup({
  -- 不自动检查插件更新
  checker = { enabled = false },
  -- 在这里添加你的插件配置
  spec = {
    -- same as: require("lazy").setup("plugins")
    -- 从 lua/plugins 目录加载插件配置
    { import = "plugins" }
  },

  git = {
    log = { "-8" }, -- 显示最近8次提交
    timeout = 120,  -- 终止超过2分钟的进程
    url_format = gitproxy .. "https://github.com/%s.git",
    -- lazy.nvim 需要 git >=2.19.0。如果你想在旧版本中使用 lazy，
    -- 可以将下面设置为 false。这样应该可以工作，但不被支持并且会
    -- 大幅增加下载量。
    filter = true,
    -- 网络相关 git 操作 (clone, fetch, checkout) 的频率
    throttle = {
      enabled = false, -- 默认不启用
      -- 每5秒最多2个操作
      rate = 2,
      duration = 5 * 1000, -- 以毫秒为单位
    },
    -- 在为插件再次运行 fetch 之前等待的秒数。
    -- 重复的更新/检查操作将不会再次运行，直到这个
    -- 冷却期过去。
    cooldown = 0,
  },
})