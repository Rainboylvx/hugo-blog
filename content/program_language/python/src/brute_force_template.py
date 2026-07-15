#!/usr/bin/env python3

import sys
from bisect import bisect_left, bisect_right
from collections import Counter, defaultdict, deque
from functools import cache
from heapq import heapify, heappop, heappush
from itertools import (
    accumulate,
    combinations,
    combinations_with_replacement,
    pairwise,
    permutations,
    product,
)
from math import gcd, inf, isqrt, lcm


# ============================================================
# 0. Constants and input
# ============================================================

INF = inf
input = sys.stdin.buffer.readline


def read_ints(readline=None):
    """Read one line of whitespace-separated integers."""
    if readline is None:
        readline = input
    return list(map(int, readline().split()))


def read_all_ints(read=None):
    """Read all remaining whitespace-separated integers."""
    if read is None:
        read = sys.stdin.buffer.read
    return list(map(int, read().split()))


# Common solve() input patterns:
# n = int(input())
# a = read_ints()
# x, y = read_ints()
# data = read_all_ints()
# print(*a)


# ============================================================
# 1. List construction quick reference
# ============================================================

# zeros = [0] * n
# squares = [x * x for x in range(n)]
# selected = [a[i] for i in range(n) if mask >> i & 1]
# grid = [[0] * m for _ in range(n)]  # Do not use [[0] * m] * n.
# indexed = list(enumerate(a))
# paired = list(zip(a, b))
# adjacent = list(pairwise(a))
# adjacent_compatible = list(zip(a, a[1:]))


# ============================================================
# 2. Pairs and intervals
# ============================================================

def iter_pairs(n):
    """Yield all index pairs (i, j) with 0 <= i < j < n."""
    for i in range(n):
        for j in range(i + 1, n):
            yield i, j


def iter_intervals(n):
    """Yield all non-empty half-open intervals [left, right)."""
    # Note: In 0-indexed arrays, generating half-open intervals [left, right)
    # is mathematically identical to generating pairs (i, j) where i < j <= n.
    yield from iter_pairs(n + 1)


# ============================================================
# 3. Subsets and Cartesian products
# ============================================================

def iter_subsets_mask(a):
    """Yield (mask, subset) for every subset of a."""
    n = len(a)
    for mask in range(1 << n):
        subset = tuple(a[i] for i in range(n) if mask >> i & 1)
        yield mask, subset


def iter_subsets(a):
    """Yield every subset as a tuple, grouped by subset size."""
    for size in range(len(a) + 1):
        yield from combinations(a, size)


def iter_binary_states(n):
    """Yield all binary states of length n as tuples."""
    yield from product([0, 1], repeat=n)


def iter_k_states(k, n):
    """Yield all k-ary states of length n as tuples."""
    yield from product(range(k), repeat=n)


# ============================================================
# 4. Permutations and combinations
# ============================================================

def iter_multisets(a, k):
    """Yield all multisets (combinations with replacement) of size k."""
    yield from combinations_with_replacement(a, k)

# for order in permutations(a):
#     ...
#
# for chosen in combinations(a, k):
#     ...
#
# for chosen in combinations_with_replacement(a, k):
#     ...


def unique_permutations(a):
    """Yield distinct permutations even when a contains duplicates."""
    items = sorted(a)
    used = [False] * len(items)
    path = []

    def dfs():
        if len(path) == len(items):
            yield tuple(path)
            return

        for i, value in enumerate(items):
            if used[i]:
                continue
            if i > 0 and items[i] == items[i - 1] and not used[i - 1]:
                continue

            used[i] = True
            path.append(value)
            yield from dfs()
            path.pop()
            used[i] = False

    yield from dfs()


# ============================================================
# 5. DFS / backtracking
# ============================================================

# Example:
# >>> dfs_assignments([["a","b"], [1,2]])
# [('a', 1), ('a', 2), ('b', 1), ('b', 2)]
def dfs_assignments(options):
    """Return every sequence that chooses one value per position."""
    answer = []
    path = []

    def dfs(position):
        if position == len(options):
            answer.append(tuple(path))
            return

        for choice in options[position]:
            # Manually uncomment the next line when pruning is needed:
            # if sum(path) + choice > SOME_LIMIT: continue
            path.append(choice)
            dfs(position + 1)
            path.pop()

    dfs(0)
    return answer


# ============================================================
# 6. BFS shortest path in an implicit state graph
# ============================================================

# Example:
# >>> def neighbors(x): return [y for y in (x-1, x+1) if 0 <= y <= 4]
# >>> bfs_shortest(0, lambda x: x == 3, neighbors)
# 3
def bfs_shortest(start, is_goal, neighbors):
    """Return the minimum number of edges to a goal, or None."""
    queue = deque([start])
    distance = {start: 0}

    while queue:
        state = queue.popleft()
        current_distance = distance[state]

        if is_goal(state):
            return current_distance

        for next_state in neighbors(state):
            if next_state in distance:
                continue
            distance[next_state] = current_distance + 1
            queue.append(next_state)

    return None


# ============================================================
# 7. Memoized DFS example
# ============================================================

def subset_sum_exists(a, target):
    """Return whether a subset of a sums to target."""
    values = tuple(a)

    @cache
    def dfs(index, current_sum):
        if index == len(values):
            return current_sum == target

        return (
            dfs(index + 1, current_sum)
            or dfs(index + 1, current_sum + values[index])
        )

    return dfs(0, 0)


# ============================================================
# 8. Prefix sums and small predicates
# ============================================================

def prefix_sums(a):
    """Return [0, a[0], a[0]+a[1], ...]."""
    return list(accumulate(a, initial=0))


def range_sum(prefix, left, right):
    """Return the sum on the half-open interval [left, right)."""
    return prefix[right] - prefix[left]


def is_strictly_increasing(a):
    return all(x < y for x, y in pairwise(a))


def is_square(n):
    if n < 0:
        return False
    root = isqrt(n)
    return root * root == n


def first_true(candidates, predicate):
    return next((x for x in candidates if predicate(x)), None)


# ============================================================
# 9. Containers and graphs
# ============================================================

def frequency(a):
    return Counter(a)


def group_by(items, key):
    groups = defaultdict(list)
    for item in items:
        groups[key(item)].append(item)
    return dict(groups)


def build_undirected_graph(n, edges):
    graph = [[] for _ in range(n)]
    for u, v in edges:
        assert 0 <= u < n and 0 <= v < n
        graph[u].append(v)
        graph[v].append(u)
    return graph


# State deduplication:
# visited = set()
# state = [1, 2, 3]
# visited.add(tuple(state))


# ============================================================
# 10. Heap and binary search quick reference
# ============================================================

# heap = [5, 1, 4]
# heapify(heap)
# heappush(heap, 2)
# smallest = heappop(heap)
#
# ordered = [1, 3, 3, 7]
# first_three = bisect_left(ordered, 3)
# after_three = bisect_right(ordered, 3)


# ============================================================
# 11. Replace this with the current problem
# ============================================================

def solve():
    # Example:
    # n, target = read_ints()
    # a = read_ints()
    # print("YES" if subset_sum_exists(a, target) else "NO")
    pass


# ============================================================
# 12. Template self-test; delete after copying if not needed
# ============================================================

def _self_test():
    from io import BytesIO

    source = BytesIO(b"1 2 3\n4 5\n")
    assert read_ints(source.readline) == [1, 2, 3]
    assert read_all_ints(source.read) == [4, 5]

    assert list(iter_pairs(0)) == []
    assert list(iter_pairs(1)) == []
    assert list(iter_pairs(3)) == [(0, 1), (0, 2), (1, 2)]
    assert list(iter_intervals(0)) == []
    assert list(iter_intervals(2)) == [(0, 1), (0, 2), (1, 2)]

    subsets_mask = list(iter_subsets_mask([10, 20]))
    assert subsets_mask == [
        (0, ()),
        (1, (10,)),
        (2, (20,)),
        (3, (10, 20)),
    ]
    assert list(iter_subsets([])) == [()]
    assert list(iter_subsets([1, 2])) == [(), (1,), (2,), (1, 2)]

    assert list(iter_binary_states(2)) == [
        (0, 0),
        (0, 1),
        (1, 0),
        (1, 1),
    ]
    
    assert list(iter_k_states(3, 2)) == [
        (0, 0), (0, 1), (0, 2),
        (1, 0), (1, 1), (1, 2),
        (2, 0), (2, 1), (2, 2)
    ]

    assert list(permutations([1, 2])) == [(1, 2), (2, 1)]
    assert list(combinations([1, 2, 3], 2)) == [(1, 2), (1, 3), (2, 3)]
    assert list(iter_multisets([1, 2], 2)) == [
        (1, 1),
        (1, 2),
        (2, 2),
    ]
    assert list(unique_permutations([])) == [()]
    assert list(unique_permutations([1, 1, 2])) == [
        (1, 1, 2),
        (1, 2, 1),
        (2, 1, 1),
    ]

    assert dfs_assignments([]) == [()]
    assert dfs_assignments([[0, 1], ["a", "b"]]) == [
        (0, "a"),
        (0, "b"),
        (1, "a"),
        (1, "b"),
    ]

    def line_neighbors(x):
        return [y for y in (x - 1, x + 1) if 0 <= y <= 4]

    assert bfs_shortest(0, lambda x: x == 0, line_neighbors) == 0
    assert bfs_shortest(0, lambda x: x == 3, line_neighbors) == 3
    assert bfs_shortest(0, lambda x: x == 1, lambda _x: ()) is None

    assert subset_sum_exists([], 0)
    assert subset_sum_exists([2, 3, 7], 5)
    assert not subset_sum_exists([2, 4], 5)

    prefix = prefix_sums([3, -2, 5, -1])
    assert prefix == [0, 3, 1, 6, 5]
    assert range_sum(prefix, 1, 3) == 3
    assert is_strictly_increasing([])
    assert is_strictly_increasing([1, 3, 8])
    assert not is_strictly_increasing([1, 3, 3])
    assert is_square(0)
    assert is_square(10**20)
    assert not is_square(15)
    assert not is_square(-1)
    assert first_true(range(10), lambda x: x > 5) == 6
    assert first_true(range(3), lambda x: x > 5) is None

    assert frequency([1, 1, 2]) == Counter({1: 2, 2: 1})
    assert group_by([1, 2, 3, 4], lambda x: x % 2) == {
        1: [1, 3],
        0: [2, 4],
    }
    assert build_undirected_graph(3, [(0, 1), (1, 2)]) == [
        [1],
        [0, 2],
        [1],
    ]

    heap = [5, 1, 4]
    heapify(heap)
    heappush(heap, 2)
    assert [heappop(heap) for _ in range(4)] == [1, 2, 4, 5]

    ordered = [1, 3, 3, 7]
    assert bisect_left(ordered, 3) == 1
    assert bisect_right(ordered, 3) == 3
    assert gcd(18, 24) == 6
    assert lcm(6, 8) == 24
    assert INF > 10**100

    print("brute_force_template: self-test passed")


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        _self_test()
    else:
        solve()
