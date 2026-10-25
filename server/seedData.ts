import bcrypt from 'bcryptjs';
import { db, User, Problem, LearningTopic, Assessment, Flashcard, UserNote } from './db.js';
import { dsaQuestionBank } from './dsaQuestionBank.js';

export async function seedInitialData() {
  const store = db.get();

  // If already seeded with 250+ problems and curriculum topics, skip
  if (store.problems.length >= 250 && store.topics.length > 0) {
    return;
  }
  if (store.problems.length < 250) {
    store.problems = dsaQuestionBank;
    db.save();
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('DemoPassword123!', salt);

  // 1. Seed Users
  if (store.users.length === 0) {
    const defaultUsers: User[] = [
      {
        id: 'user_alex',
        name: 'Alex Chen',
        email: 'alex.chen@pairarena.dev',
        passwordHash,
        role: 'interviewer',
        avatarUrl: '/src/assets/images/avatar_interviewer_alex_1792852526159.jpg',
        bio: 'Staff Software Engineer & Interview Coach. 10+ years at top tech companies.',
        targetRole: 'Staff / Tech Lead',
        skillLevel: 'advanced',
        preferredLanguage: 'python',
        learningGoals: ['Distributed Systems', 'Real-time Collaboration', 'GenAI Agent Architectures'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_elena',
        name: 'Elena Rostova',
        email: 'elena@pairarena.dev',
        passwordHash,
        role: 'learner',
        avatarUrl: '/src/assets/images/avatar_candidate_elena_1792852527001.jpg',
        bio: 'Full-stack engineer preparing for senior systems and DSA interviews.',
        targetRole: 'Senior Full-Stack Engineer',
        skillLevel: 'intermediate',
        preferredLanguage: 'typescript',
        learningGoals: ['DSA Mastery', 'RAG & Vector Search', 'System Design'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_admin',
        name: 'Admin PairArena',
        email: 'admin@pairarena.dev',
        passwordHash,
        role: 'admin',
        bio: 'System Administrator & Curriculum Lead.',
        createdAt: new Date().toISOString(),
      }
    ];
    store.users = defaultUsers;
  }

  // 2. Seed DSA Problems
  const seedProblems: Problem[] = [
    {
      id: 'prob-two-sum',
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'Easy',
      category: 'Arrays & Hashing',
      tags: ['Array', 'Hash Table'],
      acceptanceRate: 53.4,
      totalSubmissions: 1240,
      description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists.'
      ],
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
        },
        {
          input: 'nums = [3,2,4], target = 6',
          output: '[1,2]',
          explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
        }
      ],
      starterTemplates: {
        python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test runner
if __name__ == "__main__":
    import json, sys
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        nums = json.loads(lines[0])
        target = int(lines[1])
        print(json.dumps(twoSum(nums, target)))
`,
        javascript: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = JSON.parse(input[0]);
    const target = parseInt(input[1], 10);
    console.log(JSON.stringify(twoSum(nums, target)));
}
`,
        typescript: `function twoSum(nums: number[], target: number): number[] {
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement)!, i];
        }
        map.set(nums[i], i);
    }
    return [];
}

import * as fs from 'fs';
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = JSON.parse(input[0]);
    const target = parseInt(input[1], 10);
    console.log(JSON.stringify(twoSum(nums, target)));
}
`,
        cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int comp = target - nums[i];
        if (seen.find(comp) != seen.end()) {
            return {seen[comp], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    // Quick test runner
    int n, target;
    if (cin >> n) {
        vector<int> nums(n);
        for(int i=0; i<n; i++) cin >> nums[i];
        cin >> target;
        auto res = twoSum(nums, target);
        cout << "[" << res[0] << "," << res[1] << "]" << endl;
    }
    return 0;
}
`
      },
      testCases: [
        {
          id: 'tc1',
          input: '[2,7,11,15]\n9',
          expectedOutput: '[0,1]',
          isHidden: false,
          explanation: 'Standard case with sum 9.'
        },
        {
          id: 'tc2',
          input: '[3,2,4]\n6',
          expectedOutput: '[1,2]',
          isHidden: false,
          explanation: 'Duplicate numbers check.'
        },
        {
          id: 'tc3',
          input: '[3,3]\n6',
          expectedOutput: '[0,1]',
          isHidden: true,
          explanation: 'Identical value elements.'
        },
        {
          id: 'tc4',
          input: '[-1,-2,-3,-4,-5]\n-8',
          expectedOutput: '[2,4]',
          isHidden: true,
          explanation: 'Negative integers target.'
        }
      ],
      hints: [
        'A brute force O(N^2) checks every pair, but can we trade space for time?',
        'Think about storing visited elements in a hash map mapping value -> index.',
        'For each element x, check if (target - x) is already present in the hash map.'
      ],
      solutionExplanation: `### Optimal Approach: Hash Map (One Pass)

1. **Intuition**: As we traverse through the array, we check if the complement (\`target - nums[i]\`) is already in our map.
2. **Complexity**:
   - **Time Complexity**: $O(N)$ since map lookups and insertions are on average $O(1)$.
   - **Space Complexity**: $O(N)$ for the hash map storage in the worst case.`
    },
    {
      id: 'prob-valid-parentheses',
      slug: 'valid-parentheses',
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      category: 'Stacks & Queues',
      tags: ['Stack', 'String'],
      acceptanceRate: 48.9,
      totalSubmissions: 980,
      description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
      constraints: [
        '1 <= s.length <= 10^4',
        's consists of parentheses only \'()[]{}\'.'
      ],
      examples: [
        {
          input: 's = "()"',
          output: 'true'
        },
        {
          input: 's = "()[]{}"',
          output: 'true'
        },
        {
          input: 's = "(]"',
          output: 'false'
        }
      ],
      starterTemplates: {
        python: `def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack

if __name__ == "__main__":
    import sys
    s = sys.stdin.read().strip()
    print("true" if isValid(s) else "false")
`,
        javascript: `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const char of s) {
        if (map[char]) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}

const fs = require('fs');
const s = fs.readFileSync(0, 'utf-8').trim();
console.log(isValid(s) ? 'true' : 'false');
`
      },
      testCases: [
        { id: 'vp1', input: '()[]{}', expectedOutput: 'true', isHidden: false },
        { id: 'vp2', input: '(]', expectedOutput: 'false', isHidden: false },
        { id: 'vp3', input: '([)]', expectedOutput: 'false', isHidden: true },
        { id: 'vp4', input: '{[]}', expectedOutput: 'true', isHidden: true }
      ],
      hints: [
        'Use a stack to keep track of the most recently opened bracket.',
        'When you see a closing bracket, the top of the stack must match its pair.'
      ],
      solutionExplanation: `### Optimal Stack Approach
By pushing opening brackets and matching closing brackets with the stack top, we achieve $O(N)$ time and $O(N)$ space.`
    },
    {
      id: 'prob-lru-cache',
      slug: 'lru-cache',
      title: 'LRU Cache Design',
      difficulty: 'Medium',
      category: 'System Design & DSA',
      tags: ['Design', 'Hash Table', 'Linked List'],
      acceptanceRate: 42.1,
      totalSubmissions: 750,
      description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the \`key\` if the key exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update the value of the \`key\` if the \`key\` exists. Otherwise, add the \`key-value\` pair to the cache. If the number of keys exceeds the \`capacity\` from this operation, evict the least recently used key.

The functions \`get\` and \`put\` must each run in **$O(1)$ average time complexity**.`,
      constraints: [
        '1 <= capacity <= 3000',
        '0 <= key <= 10^4',
        '0 <= value <= 10^5',
        'At most 2 * 10^5 calls will be made to get and put.'
      ],
      examples: [
        {
          input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
          output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
          explanation: 'Cache operations evict key 2, then key 1.'
        }
      ],
      starterTemplates: {
        python: `class DLinkedNode:
    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cache = {}
        self.head = DLinkedNode()
        self.tail = DLinkedNode()
        self.head.next = self.tail
        self.tail.prev = self.head
        self.capacity = capacity
        self.size = 0

    def _add_node(self, node):
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node

    def _remove_node(self, node):
        prev = node.prev
        new = node.next
        prev.next = new
        new.prev = prev

    def _move_to_head(self, node):
        self._remove_node(node)
        self._add_node(node)

    def _pop_tail(self):
        res = self.tail.prev
        self._remove_node(res)
        return res

    def get(self, key: int) -> int:
        node = self.cache.get(key, None)
        if not node:
            return -1
        self._move_to_head(node)
        return node.value

    def put(self, key: int, value: int) -> None:
        node = self.cache.get(key)
        if not node:
            newNode = DLinkedNode(key, value)
            self.cache[key] = newNode
            self._add_node(newNode)
            self.size += 1
            if self.size > self.capacity:
                tail = self._pop_tail()
                del self.cache[tail.key]
                self.size -= 1
        else:
            node.value = value
            self._move_to_head(node)

if __name__ == "__main__":
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    print(cache.get(1)) # 1
    cache.put(3, 3)
    print(cache.get(2)) # -1
`,
        javascript: `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.map = new Map();
    }
    get(key) {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, val);
        return val;
    }
    put(key, value) {
        if (this.map.has(key)) {
            this.map.delete(key);
        } else if (this.map.size >= this.capacity) {
            const oldestKey = this.map.keys().next().value;
            this.map.delete(oldestKey);
        }
        this.map.set(key, value);
    }
}
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1));
cache.put(3, 3);
console.log(cache.get(2));
`
      },
      testCases: [
        { id: 'lru1', input: 'test', expectedOutput: '1\n-1', isHidden: false }
      ],
      hints: [
        'How can you achieve O(1) removal and O(1) insertion at the front?',
        'Doubly linked list combined with a hash table gives O(1) access to arbitrary nodes and O(1) node relocation.'
      ],
      solutionExplanation: `Combining a Hash Map with a Doubly Linked List gives $O(1)$ average time for both \`get\` and \`put\`.`
    },
    {
      id: 'prob-coin-change',
      slug: 'coin-change',
      title: 'Coin Change (Min Coins)',
      difficulty: 'Medium',
      category: 'Dynamic Programming',
      tags: ['Dynamic Programming', 'Breadth-First Search'],
      acceptanceRate: 44.2,
      totalSubmissions: 890,
      description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
      constraints: [
        '1 <= coins.length <= 12',
        '1 <= coins[i] <= 2^31 - 1',
        '0 <= amount <= 10^4'
      ],
      examples: [
        {
          input: 'coins = [1,2,5], amount = 11',
          output: '3',
          explanation: '11 = 5 + 5 + 1'
        },
        {
          input: 'coins = [2], amount = 3',
          output: '-1'
        }
      ],
      starterTemplates: {
        python: `def coinChange(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1

if __name__ == "__main__":
    import json, sys
    lines = sys.stdin.read().strip().split("\\n")
    if len(lines) >= 2:
        coins = json.loads(lines[0])
        amount = int(lines[1])
        print(coinChange(coins, amount))
`
      },
      testCases: [
        { id: 'cc1', input: '[1,2,5]\n11', expectedOutput: '3', isHidden: false },
        { id: 'cc2', input: '[2]\n3', expectedOutput: '-1', isHidden: false },
        { id: 'cc3', input: '[1]\n0', expectedOutput: '0', isHidden: true }
      ],
      hints: [
        'Define dp[i] as the minimum coins needed to make amount i.',
        'Transition: dp[i] = min(dp[i], dp[i - coin] + 1) for each coin in coins.'
      ],
      solutionExplanation: `Bottom-up dynamic programming computing minimum coins in $O(Amount \\times N)$ time.`
    }
  ];

  store.problems = dsaQuestionBank;

  // 3. Seed Learning Tracks & Topics
  const seedTopics: LearningTopic[] = [
    {
      id: 'dsa-big-o',
      trackId: 'dsa',
      slug: 'complexity-analysis-big-o',
      title: 'Time & Space Complexity: The Big-O Constitution',
      difficulty: 'Beginner',
      estMinutes: 25,
      prerequisites: ['Basic Programming', 'Algebraic Functions'],
      summary: 'Master asymptotic notation: Big-O, Big-Omega, Big-Theta, amortized analysis, and memory stack vs heap footprint.',
      contentMarkdown: `# Asymptotic Analysis & The Big-O Standard

In technical coding interviews at top tech companies, estimating the asymptotic efficiency of your algorithm before writing any code is non-negotiable.

## 1. What is Big-O Really?
Big-O describes the **upper bound** on the growth rate of runtime or space consumption as input size $N$ trends toward infinity.

### Order of Dominance:
1. **$O(1)$** — Constant time (Hash map access, array index lookup)
2. **$O(\\log N)$** — Logarithmic time (Binary search, balanced BST search)
3. **$O(N)$** — Linear time (Single pass scan, prefix sums)
4. **$O(N \\log N)$** — Linearithmic time (Merge sort, Quicksort average, Heap sort)
5. **$O(N^2)$** — Quadratic time (Nested loops over arrays)
6. **$O(2^N)$** — Exponential time (Subsets recursion, Fibonacci naive)
7. **$O(N!)$** — Factorial time (Permutations generation)

## 2. Amortized Complexity
Consider dynamic array doubling (like \`vector\` in C++ or \`ArrayList\` in Java or dynamic lists in Python). While allocating a new array takes $O(N)$ time when full, doubling the capacity means this operation happens so infrequently that the average per-operation cost is strictly $O(1)$.

## 3. Auxiliary Space vs. Total Space
- **Total Space**: Input array size + working data structures + call stack frames.
- **Auxiliary Space**: Working memory allocated exclusively by your algorithm to solve the problem (excluding the input).`,
      codeExamples: {
        python: `# O(N) Time and O(1) Auxiliary Space
def find_max(nums: list[int]) -> int:
    current_max = nums[0]
    for x in nums[1:]:
        if x > current_max:
            current_max = x
    return current_max
`,
        typescript: `// Binary Search: O(log N) Time, O(1) Space
function binarySearch(arr: number[], target: number): number {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`
      },
      quiz: [
        {
          question: 'What is the time complexity of building a heap from an array of N unsorted elements using Floyd\'s build-heap algorithm?',
          options: ['O(N log N)', 'O(N)', 'O(log N)', 'O(N^2)'],
          correctIndex: 1,
          explanation: 'Floyd\'s algorithm runs in linear O(N) time because nodes near the leaves require significantly fewer sift-down steps.'
        },
        {
          question: 'If an algorithm uses recursion with max depth N and allocates an O(1) variable at each stack frame, what is its auxiliary space?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
          correctIndex: 2,
          explanation: 'Call stack frames consume O(1) memory each. For depth N, total stack space is O(N).'
        }
      ],
      interviewQuestions: [
        'How do you explain the difference between Worst Case O(N) and Amortized O(1)?',
        'Can an algorithm have O(1) auxiliary space but O(N) total space?',
        'Why is Quicksort preferred over Mergesort for in-memory array sorting despite worst-case O(N^2)?'
      ],
      keyTakeaways: [
        'Always drop non-dominant terms and constants (O(2N + 5) becomes O(N)).',
        'Watch out for hidden operations like string concatenation or slice operations inside loops.',
        'Recursive call stack memory must always be counted in space complexity.'
      ]
    },
    {
      id: 'genai-rag-pipeline',
      trackId: 'genai-rag',
      slug: 'rag-architecture-embeddings-vector-search',
      title: 'Production RAG: Chunking, Embeddings & Vector Search',
      difficulty: 'Intermediate',
      estMinutes: 35,
      prerequisites: ['Python / TypeScript', 'Vector Math Basics', 'LLM Fundamentals'],
      summary: 'Architecting high-accuracy Retrieval-Augmented Generation systems with hybrid search, contextual chunking, and re-ranking.',
      contentMarkdown: `# Retrieval-Augmented Generation (RAG) Architecture

LLMs possess vast general knowledge but suffer from static training cutoffs, hallucinations, and lack of private enterprise domain knowledge. RAG bridges this gap by grounding queries in authenticated retrieval data.

## 1. The Core 3-Stage Pipeline
1. **Ingestion & Processing**:
   - Extract raw text from PDFs, Markdown, databases, and APIs.
   - Chunk text intelligently using semantic boundaries (Markdown headers, recursive character splitter) with 10–20% token overlap.
2. **Embedding & Indexing**:
   - Convert text chunks into dense floating-point vector representations (e.g. 768 or 1536 dimensions).
   - Index vectors into a vector database (PostgreSQL with pgvector, Pinecone, Milvus) using HNSW or IVF indexes.
3. **Retrieval, Re-ranking & Synthesis**:
   - Compute cosine similarity or dot product between the user query embedding and document embeddings.
   - Apply Cross-Encoder re-ranking to filter noise.
   - Inject the top-K relevant chunks into the LLM system prompt.

## 2. Chunking Strategies
- **Fixed Window**: 500 characters, 50 overlap. Fast, but risks cutting sentences in half.
- **Recursive Character**: Splits on double newlines, single newlines, spaces, and punctuation sequentially.
- **Semantic Chunking**: Computes embedding distances between consecutive sentences and cuts when distance exceeds a threshold.`,
      codeExamples: {
        typescript: `// Example RAG Retrieval Prompt Assembly
export function buildRAGPrompt(query: string, retrievedChunks: { text: string; source: string }[]) {
  const contextString = retrievedChunks
    .map((chunk, idx) => \`[Document \${idx + 1} | Source: \${chunk.source}]\\n\${chunk.text}\`)
    .join('\\n\\n');

  return {
    systemInstruction: \`You are an authoritative technical assistant. Answer the user prompt using ONLY the provided retrieved documents. Cite sources using [Doc X]. If the answer is not in the documents, state that clearly.\`,
    prompt: \`CONTEXT:\\n\${contextString}\\n\\nUSER QUESTION: \${query}\`
  };
}`
      },
      quiz: [
        {
          question: 'What is the primary benefit of applying a Cross-Encoder Re-ranker after initial vector retrieval?',
          options: [
            'It accelerates index ingestion speed.',
            'It evaluates full joint attention between the query and candidate chunk, dramatically improving precision of top results.',
            'It eliminates the need for vector databases completely.',
            'It reduces the model temperature to zero.'
          ],
          correctIndex: 1,
          explanation: 'Vector search (Bi-Encoder) is fast but approximate. Cross-encoders score query-chunk pairs jointly, catching subtle semantic nuances.'
        }
      ],
      interviewQuestions: [
        'How do you prevent hallucinations in RAG when the retrieved documents do not contain the answer?',
        'Compare dense vector retrieval against BM25 keyword search and explain why Hybrid Search is standard in production.',
        'How would you design a cache for repeated semantic queries?'
      ],
      keyTakeaways: [
        'Garbage In, Garbage Out: Clean parsing and semantic chunking matter more than model parameter size.',
        'Always evaluate retrieval quality separately from generation quality (Hit Rate, MRR, Faithfulness).',
        'Enforce strict system boundaries to mitigate prompt injection via retrieved content.'
      ]
    },
    {
      id: 'sys-design-rate-limiter',
      trackId: 'system-design',
      slug: 'distributed-rate-limiter-design',
      title: 'Distributed Rate Limiting at Scale',
      difficulty: 'Intermediate',
      estMinutes: 30,
      prerequisites: ['Networking', 'Redis Fundamentals', 'HTTP Headers'],
      summary: 'Design a resilient distributed API rate limiter protecting services from DDoS, scraping, and resource starvation.',
      contentMarkdown: `# Designing a High-Throughput Distributed Rate Limiter

A rate limiter caps the number of requests a client can make in a specified window of time (e.g. 100 requests per minute per IP or API key).

## 1. Core Algorithms
1. **Token Bucket** (Used by AWS, Stripe):
   - A bucket has fixed capacity $C$. Tokens refill at rate $r$ tokens/second.
   - Each request takes 1 token. If bucket is empty, request is dropped (HTTP 429).
2. **Leaky Bucket**:
   - Requests enter a FIFO queue. Requests are processed at a constant leak rate. Excess requests overflow.
3. **Fixed Window Counter**:
   - Count requests in 1-minute blocks. Vulnerable to 2x burst at window boundaries.
4. **Sliding Window Log**:
   - Stores timestamps in a sorted set (Redis ZSET). Very accurate, but higher memory consumption.
5. **Sliding Window Counter** (Optimal compromise):
   - Combines previous window count and current window count based on time overlap percentage.

## 2. Distributed Architecture with Redis & Lua
To prevent race conditions across multiple API gateway nodes, atomicity is required. We execute a Lua script in Redis so the GET, CHECK, and INCR operations run atomically in a single Redis thread.`,
      codeExamples: {
        typescript: `// Redis Lua Script for Atomic Sliding Window Rate Limiting
const rateLimitLua = \`
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local current_time = tonumber(ARGV[2])
local window = tonumber(ARGV[3])

-- Clean up entries older than current window
redis.call('ZREMRANGEBYSCORE', key, 0, current_time - window)

-- Count current requests
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, current_time, current_time)
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return {1, limit - count - 1}
else
    return {0, 0}
end
\`;`
      },
      quiz: [
        {
          question: 'Why are Lua scripts preferred when implementing rate limiting with Redis across distributed web servers?',
          options: [
            'They bypass Redis completely.',
            'They execute atomically on Redis without requiring client-side distributed locks or multi-step network round trips.',
            'They compress JSON payloads automatically.',
            'They support SQL queries.'
          ],
          correctIndex: 1,
          explanation: 'Redis executes Lua scripts atomically in its event loop, preventing race conditions (e.g. two concurrent requests reading the counter simultaneously).'
        }
      ],
      interviewQuestions: [
        'How do you inform the client about their current rate limit status in HTTP response headers?',
        'What strategy would you use if Redis goes down: Fail Open or Fail Closed?',
        'How would you handle rate limiting across geographically distributed regions without cross-region latency on every request?'
      ],
      keyTakeaways: [
        'Use standard headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After.',
        'Token Bucket handles bursty traffic smoothly; Sliding Window Counter gives high precision with low memory.',
        'Centralized Redis storage requires atomic execution via Lua scripts.'
      ]
    },
    {
      id: 'fullstack-websockets-realtime',
      trackId: 'fullstack',
      slug: 'websockets-realtime-collaboration',
      title: 'Real-Time Architecture: WebSockets & Event-Driven Systems',
      difficulty: 'Intermediate',
      estMinutes: 28,
      prerequisites: ['HTTP Protocol', 'Node.js Event Loop', 'React State'],
      summary: 'Architecting low-latency bidirectional communication for live coding, pair programming, and collaborative workspaces.',
      contentMarkdown: `# Real-Time WebSockets & Collaborative Synchronization

Standard HTTP request-response architecture is simplex and pull-based. For real-time applications like pair coding, live document collaboration, and instant chat, WebSockets provide a persistent, full-duplex TCP channel.

## 1. WebSocket Lifecycle
1. **HTTP Upgrade Handshake**: Client initiates an HTTP request with \`Upgrade: websocket\` and \`Connection: Upgrade\` headers.
2. **Bi-directional Framing**: Once established, either side can send binary or text frames with low overhead (2–10 bytes header vs kilobytes of HTTP headers).
3. **Heartbeat & PING/PONG**: Keep connections alive through load balancers and detect dead peers.

## 2. Conflict Handling & State Synchronization
- **Server-Authoritative State**: The server maintains canonical truth and validates incoming events with sequence numbers.
- **Operational Transformation (OT) / CRDTs**: For concurrent character-by-character editing across distributed clients.
- **Throttling & Debouncing**: Code changes must be batched or debounced (e.g. 50ms) to prevent overwhelming the network while maintaining smooth visual responsiveness.`,
      codeExamples: {
        typescript: `// Socket.IO Server Room Broadcast with Auth
io.on('connection', (socket) => {
  socket.on('interview:join', ({ roomId, userName, role }) => {
    socket.join(roomId);
    socket.to(roomId).emit('participant:presence', {
      userId: socket.id,
      userName,
      role,
      status: 'online'
    });
  });

  socket.on('code:change', ({ roomId, code, cursorPosition }) => {
    // Broadcast change to peers in the same room
    socket.to(roomId).emit('code:change', { code, cursorPosition, senderId: socket.id });
  });
});`
      },
      quiz: [
        {
          question: 'What happens to a WebSocket connection when an intermediary proxy or firewall terminates idle TCP connections?',
          options: [
            'The browser automatically recovers without notice.',
            'The socket drops silently unless periodic PING/PONG heartbeats are exchanged.',
            'The connection switches to UDP.',
            'The HTTP cache serves stale data.'
          ],
          correctIndex: 1,
          explanation: 'Proxies drop silent idle TCP connections. Periodic heartbeat pings keep the NAT table entry alive and trigger quick reconnection if dropped.'
        }
      ],
      interviewQuestions: [
        'How do you scale WebSockets horizontally across a fleet of 10 backend servers?',
        'Compare Server-Sent Events (SSE) with WebSockets: when would you choose SSE instead?',
        'How do you authenticate WebSocket connections securely with HTTP-only cookies?'
      ],
      keyTakeaways: [
        'Authenticate during the initial handshake, not after.',
        'Use Redis Pub/Sub or Socket.IO Redis Adapter for multi-server scaling.',
        'Always implement client reconnection with exponential backoff.'
      ]
    }
  ];

  store.topics = seedTopics;

  // 4. Seed Assessments
  const seedAssessments: Assessment[] = [
    {
      id: 'dsa-core-assessment',
      title: 'DSA Core Foundations Assessment',
      track: 'Data Structures & Algorithms',
      difficulty: 'Medium',
      durationMinutes: 30,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          prompt: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST)?',
          options: ['O(log N)', 'O(1)', 'O(N)', 'O(N log N)'],
          correctAnswer: 'O(N)',
          explanation: 'An unbalanced BST can degenerate into a linked list, causing search to inspect all N nodes in the worst case.'
        },
        {
          id: 'q2',
          type: 'mcq',
          prompt: 'Which data structure is optimal for implementing an LRU Cache with O(1) get and O(1) put operations?',
          options: [
            'Array and Binary Search',
            'Hash Map combined with a Doubly Linked List',
            'Max Heap with a Stack',
            'Red-Black Tree'
          ],
          correctAnswer: 'Hash Map combined with a Doubly Linked List',
          explanation: 'Hash map provides O(1) key-to-node lookup, while doubly linked list provides O(1) node relocation to the head and eviction from the tail.'
        },
        {
          id: 'q3',
          type: 'mcq',
          prompt: 'In Dijkstra\'s shortest path algorithm with a min-priority queue on a graph with V vertices and E edges, what is the time complexity?',
          options: ['O(V^2)', 'O((V + E) log V)', 'O(V * E)', 'O(E^2)'],
          correctAnswer: 'O((V + E) log V)',
          explanation: 'Each vertex is popped from the heap once (V log V) and each edge may update a distance key (E log V), yielding O((V + E) log V).'
        }
      ]
    },
    {
      id: 'genai-rag-readiness',
      title: 'GenAI & Production RAG Assessment',
      track: 'Generative AI & LLMs',
      difficulty: 'Medium',
      durationMinutes: 25,
      questions: [
        {
          id: 'gq1',
          type: 'mcq',
          prompt: 'Which metric measures the degree to which an LLM-generated answer is supported strictly by the retrieved context without hallucination?',
          options: ['Perplexity', 'Faithfulness / Groundedness', 'ROUGE-1', 'BLEU Score'],
          correctAnswer: 'Faithfulness / Groundedness',
          explanation: 'Faithfulness measures whether all claims in the generated answer are grounded in the retrieved context chunks.'
        },
        {
          id: 'gq2',
          type: 'mcq',
          prompt: 'Why are bi-encoder embeddings commonly used for initial retrieval instead of cross-encoders?',
          options: [
            'Bi-encoders allow pre-computing document vectors offline and performing sub-millisecond approximate nearest neighbor (ANN) search at query time.',
            'Bi-encoders have zero parameter size.',
            'Bi-encoders do not require vector indices.',
            'Bi-encoders prevent token limits.'
          ],
          correctAnswer: 'Bi-encoders allow pre-computing document vectors offline and performing sub-millisecond approximate nearest neighbor (ANN) search at query time.',
          explanation: 'Bi-encoders encode queries and documents independently, allowing offline index computation and fast vector dot-product at runtime.'
        }
      ]
    }
  ];

  store.assessments = seedAssessments;

  // 5. Seed Flashcards
  const defaultFlashcards: Flashcard[] = [
    {
      id: 'fc-1',
      userId: 'user_alex',
      front: 'What is the time complexity of building an unweighted adjacency list graph with V vertices and E edges?',
      back: 'O(V + E) time, allocating O(V + E) space.',
      category: 'Graph Theory',
      confidence: 4,
      nextReviewDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      reviewCount: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fc-2',
      userId: 'user_alex',
      front: 'How does Token Bucket differ from Leaky Bucket in API rate limiting?',
      back: 'Token Bucket allows bursts up to the bucket capacity while maintaining an average rate. Leaky Bucket enforces a smooth, constant output rate regardless of bursts.',
      category: 'System Design',
      confidence: 5,
      nextReviewDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      reviewCount: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fc-3',
      userId: 'user_alex',
      front: 'What is the purpose of the SameSite=Lax/Strict cookie attribute in web security?',
      back: 'It prevents the browser from sending the cookie along with cross-site requests, mitigating Cross-Site Request Forgery (CSRF) attacks.',
      category: 'Security & Auth',
      confidence: 4,
      nextReviewDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      reviewCount: 4,
      createdAt: new Date().toISOString()
    }
  ];

  store.flashcards = defaultFlashcards;

  // 6. Seed Notes
  const defaultNotes: UserNote[] = [
    {
      id: 'note-1',
      userId: 'user_alex',
      title: 'System Design Interview Cheatsheet: Numbers Every Engineer Should Know',
      content: `### Latency Numbers (Jeff Dean estimates):
- L1 cache reference: 0.5 ns
- Branch mispredict: 5 ns
- L2 cache reference: 7 ns
- Mutex lock/unlock: 25 ns
- Main memory reference: 100 ns
- Compress 1KB with Snappy: 2,000 ns
- Send 1KB over 1Gbps network: 10,000 ns
- Read 1MB sequentially from SSD: 1,000,000 ns (1 ms)
- Round trip in same datacenter: 500,000 ns (0.5 ms)
- Disk seek: 10,000,000 ns (10 ms)
- Read 1MB sequentially from disk: 20,000,000 ns (20 ms)
- Send packet CA to Netherlands and back: 150,000,000 ns (150 ms)

### Key Rule of Thumb:
Memory is ~100x faster than SSD reads, which are ~100x faster than rotational disk seeks.`,
      category: 'System Design',
      tags: ['Latency', 'Architecture', 'Hardware'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  store.notes = defaultNotes;

  // Save seeded state
  db.save();
  console.log('PairArena AI database successfully initialized with seed content.');
}
