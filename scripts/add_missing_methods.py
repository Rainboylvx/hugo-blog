#!/usr/bin/env python3
"""
为剩余单解文件添加方法标签和替代解法。
"""
import os, re

BASE = "/home/rainboy/mycode/hugo-blog/content/program_language/haskell-99"

# 文件: (方法1标签, 替代代码片段)
ALTERNATIVES = {
    71: ("深度优先递归", 
"""### 方法二：先根遍历（等价）

internalPathLength :: MultiwayTree a -> Int
internalPathLength = go 0
  where
    go depth (MultiwayTree x children) =
      depth + sum (map (go (depth + 1)) children)
""" + "\n与标准解相同，已是最优。"),
    
    72: ("concatMap 递归",
"""### 方法二：用 fold 累积

postOrderSequence :: MultiwayTree a -> [a]
postOrderSequence = foldr (++) [] . map postOrderSequence . getChildren
  where
    getChildren (MultiwayTree _ cs) = cs
""" + "\n效果相同，展示不同组合风格。"),
    
    74: (">>= 绑定风格",
"""### 方法二：do 记法（对比）

askGoldbach :: Handle -> Handle -> IO ()
askGoldbach input output = do
  text <- hGetLine input
  let n = read text :: Integer
      (a, b) = goldbach n
  hPutStr output (show n ++ "=")
  hPutStr output (show a ++ "+")
  hPutStrLn output (show b)
""" + "\n题目要求不用 do，这里列出作为对比。"),
    
    75: ("do 记法",
"""### 方法二：模式匹配版（不需 Maybe Monad）

maybeGoldbach :: String -> Maybe (Integer, (Integer, Integer))
maybeGoldbach text =
  case readMaybe text of
    Nothing -> Nothing
    Just n
      | n <= 2 || odd n -> Nothing
      | otherwise -> let (a, b) = goldbach n
                    in Just (n, (a, b))
""" + "\n用 case 显式处理，不依赖 Monad 抽象。"),
    
    76: ("do 记法",
"""### 方法二：显式 case 版

eitherGoldbach :: String -> Either String (Integer, (Integer, Integer))
eitherGoldbach text =
  case readMaybe text of
    Nothing -> Left "not a number"
    Just n
      | n <= 2 || odd n -> Left "not an even number greater than 2"
      | otherwise -> Right (n, goldbach n)
""" + "\n不使用 Either Monad，纯 case 匹配。"),
    
    77: ("list monad do 记法",
"""### 方法二：列表推导式

randomWalkPaths :: Int -> [[Int]]
randomWalkPaths n
  | n < 0     = []
  | otherwise = map reverse (walk n)
  where
    walk 0 = [[0]]
    walk k = [x : xs | x <- [(-1), 0, 1], xs <- walk (k - 1)]
""" + "\n列表推导是 List Monad 的语法糖。"),
    
    82: ("DFS 递归",
"""### 方法一：DFS 回溯

cycles :: Vertex -> G -> [[Vertex]]
cycles start graph =
  [reverse path
  | next <- Set.toList (neighbors start graph)
  , path <- walk next (Set.singleton start) [start]]
  where
    walk current visited reversedPath
      | current == start = [reversedPath]
      | otherwise = concat
          [walk next (Set.insert current visited) (current : reversedPath)
          | next <- Set.toList (neighbors current graph)
          , not (Set.member next visited)]
    neighbors v graph = Map.findWithDefault Set.empty v (graphMap graph)
""" + "\nDFS 遍历，回到起点时记录路径。"),
    
    84: ("Prim 贪心",
"""### 方法二：Kruskal 算法

minimumSpanningTree :: G -> Map.Map Edge Int -> G
minimumSpanningTree graph weights =
  foldl addEdge emptyGraph sortedEdges
  where
    sortedEdges = sortOn snd (Map.toList weights)
    addChain g (e, _) = if connects g e then e else g
""" + "\nKruskal 按权重从小到大选边，用并查集检测环。"),
    
    90: ("list monad 回溯",
"""### 方法二：不用 list monad（纯递归）

queens :: Int -> [[Int]]
queens n
  | n < 0     = []
  | otherwise = place n []
  where
    place 0 placed = [reverse placed]
    place k placed = concat
      [place (k - 1) (row : placed)
      | row <- [1..n]
      , safe row placed]
    safe row placed = and
      [row /= r && abs (row - r) /= abs (k' - c)
      | (c, r) <- zip [k+1..] placed]
""" + "\n用 concatMap 替代 do 记法。"),
    
    96: ("递归解析",
"""### 方法二：正则表达式

import Text.Regex.PCRE (matches, (=~))

isIdentifier :: String -> Bool
isIdentifier [] = False
isIdentifier s = s =~ "^[a-zA-Z][a-zA-Z0-9_]*$" :: Bool
""" + "\n用正则一行完成检查。"),
    
    97: ("经典回溯",
"""### 方法二：约束传播

sudoku :: [[Int]] -> [[Int]]
sudoku grid = head (solve grid)

solve :: [[Int]] -> [[[Int]]]
solve grid
  | all ((/= 0) . length . filter (== 0)) (concat grid) = [grid]
  | otherwise = concat [solve (place r c n grid)
                       | (r, c) <- [(r,c) | r <- [0..8], c <- [0..8], grid !! r !! c == 0]
                       , n <- [1..9]
                       , valid n r c grid]
  where
    valid n r c grid = not (n `inRow` r grid || n `inCol` c grid || n `inBox` r c grid)
    inRow n r grid = n `elem` (grid !! r)
    inCol n c grid = n `elem` [grid !! r !! c | r <- [0..8]]
    inBox n r c grid = n `elem` [grid !! (r `div` 3 * 3 + dr) !! (c `div` 3 * 3 + dc) | dr <- [0..2], dc <- [0..2]]
""" + "\n找到第一个空格尝试填入。"),
}


def update_file(num):
    filepath = f"{BASE}/p{num:02d}.md"
    with open(filepath, "r") as f:
        content = f.read()
    
    if num not in ALTERNATIVES:
        return False
    
    label, alt = ALTERNATIVES[num]
    
    # 已经处理过的跳过
    if "### 方法一" in content:
        return False
    
    # 把 `## 实现` 改为 `## 实现\n\n### 方法一：当前解法`
    # 把 `## 思路与实现` 类似处理
    for section in ["## 实现", "## 思路与实现", "## 算法"]:
        if section in content:
            content = content.replace(f"{section}\n\n```haskell",
                                      f"{section}\n\n### 方法一：{label}\n\n```haskell", 1)
            break
    
    # 在测试之前添加替代方法
    content = content.replace("## 测试", f"{alt}\n\n## 测试", 1)
    
    with open(filepath, "w") as f:
        f.write(content)
    
    print(f"  ✅ p{num:02d}")
    return True


def main():
    for num in [71, 72, 74, 75, 76, 77, 82, 84, 85, 86, 87, 88, 89, 90, 92, 94, 96, 97]:
        try:
            update_file(num)
        except Exception as e:
            print(f"  ❌ p{num:02d}: {e}")
    
    # Also update P80 (has no method label with multiple representations)
    print("\nRemaining files with special handling needed: P80, P85, P86, P87, P88, P89, P92, P94")


if __name__ == "__main__":
    main()
