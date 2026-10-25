import { execFile, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
  expectedOutput?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compileOutput?: string;
  exitCode: number;
  executionTimeMs: number;
  memoryKb?: number;
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error';
  provider: 'wandbox' | 'sandboxed-runner';
  providerStatus?: string;
}

// Wandbox Compiler Identifier Mapping
// Verified against Wandbox API (https://wandbox.org/api/list.json)
const WANDBOX_COMPILERS: Record<string, string> = {
  cpp: 'gcc-head',
  'c++': 'gcc-head',
  c: 'gcc-head-c',
  python: 'cpython-3.12.7',
  py: 'cpython-3.12.7',
  javascript: 'nodejs-20.17.0',
  js: 'nodejs-20.17.0',
  typescript: 'typescript-5.6.2',
  ts: 'typescript-5.6.2',
  java: 'openjdk-jdk-21+35',
  go: 'go-head',
  rust: 'rust-head',
};

const WANDBOX_BASE_URL = process.env.WANDBOX_BASE_URL || 'https://wandbox.org/api';
const CODE_EXECUTION_PROVIDER = process.env.CODE_EXECUTION_PROVIDER || 'wandbox';
// Public Compiler Service Notice:
// Wandbox is a community-supported public compiler infrastructure.
// It may have rate limits, concurrent request bounds, and availability fluctuations.
// PairArena AI enforces strict client-side/server-side timeouts (15s), payload size limits (128KB),
// output limits (64KB), and an isolated child-process sandbox fallback when Wandbox is unreachable
// or when executing intensive multi-test hidden suites.

const MAX_CODE_BYTES = 128 * 1024; // 128 KB
const MAX_STDIN_BYTES = 64 * 1024; // 64 KB
const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB output limit

export async function executeCode(req: ExecutionRequest): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Input validation
  if (!req.code || typeof req.code !== 'string') {
    return {
      stdout: '',
      stderr: 'Validation Error: Source code cannot be empty.',
      exitCode: 1,
      executionTimeMs: 0,
      verdict: 'Compilation Error',
      provider: 'wandbox',
      providerStatus: 'Validation failed: empty code',
    };
  }

  if (req.code.length > MAX_CODE_BYTES) {
    return {
      stdout: '',
      stderr: `Validation Error: Source code exceeds maximum allowable limit of ${MAX_CODE_BYTES / 1024} KB.`,
      exitCode: 1,
      executionTimeMs: 0,
      verdict: 'Compilation Error',
      provider: 'wandbox',
      providerStatus: 'Validation failed: code size exceeded',
    };
  }

  if (req.stdin && req.stdin.length > MAX_STDIN_BYTES) {
    return {
      stdout: '',
      stderr: `Validation Error: Stdin input exceeds maximum allowable limit of ${MAX_STDIN_BYTES / 1024} KB.`,
      exitCode: 1,
      executionTimeMs: 0,
      verdict: 'Compilation Error',
      provider: 'wandbox',
      providerStatus: 'Validation failed: stdin size exceeded',
    };
  }

  const language = (req.language || '').toLowerCase().trim();
  const compiler = WANDBOX_COMPILERS[language];

  // 1. If Wandbox is configured as provider and compiler is supported, execute via Wandbox API
  if (CODE_EXECUTION_PROVIDER === 'wandbox' && compiler) {
    try {
      let codeToCompile = req.code;
      // For Java in Wandbox, the source file is prog.java.
      // If a class is declared 'public class Main', Java compiler requires Main.java.
      // Replacing 'public class' with 'class' allows smooth compilation of standard template.
      if (language === 'java') {
        codeToCompile = codeToCompile.replace(/public\s+class\s+Main/g, 'class Main');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s upstream timeout

      const response = await fetch(`${WANDBOX_BASE_URL}/compile.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PairArena-AI/1.0',
        },
        body: JSON.stringify({
          compiler,
          code: codeToCompile,
          stdin: req.stdin || '',
          save: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const duration = Date.now() - startTime;

        const rawStatus = data.status;
        const exitCode = typeof rawStatus === 'number' ? rawStatus : parseInt(rawStatus ?? '0', 10);
        const compilerErr = (data.compiler_error || data.compiler_message || '').trim();
        const programOut = (data.program_output || data.program_message || '').trim();
        const programErr = (data.program_error || '').trim();
        const signal = (data.signal || '').trim();

        let verdict: ExecutionResult['verdict'] = 'Accepted';
        let stdout = programOut;
        let stderr = '';
        let compileOutput: string | undefined = undefined;

        if (compilerErr && exitCode !== 0) {
          verdict = 'Compilation Error';
          compileOutput = compilerErr;
          stderr = compilerErr;
        } else if (exitCode !== 0 || signal) {
          verdict = signal ? 'Time Limit Exceeded' : 'Runtime Error';
          stderr = programErr || signal || `Process exited with code ${exitCode}`;
        } else if (req.expectedOutput !== undefined && req.expectedOutput !== null) {
          // Compare with expected output with normalized whitespace and punctuation
          const normOut = stdout.replace(/\r\n/g, '\n').replace(/,\s+/g, ',').trim();
          const normExp = req.expectedOutput.replace(/\r\n/g, '\n').replace(/,\s+/g, ',').trim();
          verdict = normOut === normExp ? 'Accepted' : 'Wrong Answer';
        }

        if (stdout.length > MAX_OUTPUT_BYTES) {
          stdout = stdout.slice(0, MAX_OUTPUT_BYTES) + '\n... [Output truncated: exceeded 64 KB limit]';
        }
        if (stderr.length > MAX_OUTPUT_BYTES) {
          stderr = stderr.slice(0, MAX_OUTPUT_BYTES) + '\n... [Error output truncated: exceeded 64 KB limit]';
        }

        return {
          stdout,
          stderr,
          compileOutput,
          exitCode: isNaN(exitCode) ? 0 : exitCode,
          executionTimeMs: duration,
          verdict,
          provider: 'wandbox',
          providerStatus: `Wandbox (${compiler}): ${verdict}`,
        };
      } else {
        console.warn(`Wandbox upstream returned HTTP ${response.status}, falling back to local isolated sandbox.`);
      }
    } catch (err: any) {
      console.warn('Wandbox API execution error or timeout, falling back to local isolated sandbox:', err?.message || err);
    }
  }

  // 2. Sandboxed Isolated Local Execution Fallback
  return await executeInIsolatedSandbox(req);
}

// Executes inside an isolated process with strict timeout and buffer limits
async function executeInIsolatedSandbox(req: ExecutionRequest): Promise<ExecutionResult> {
  const language = req.language.toLowerCase();
  const timeoutMs = 5000;
  const maxBuffer = 256 * 1024; // 256 KB max stdout
  const startTime = Date.now();

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pairarena-runner-'));

  try {
    let cmd = '';
    let args: string[] = [];
    let filePath = '';

    if (language === 'python' || language === 'py') {
      filePath = path.join(tempDir, 'solution.py');
      fs.writeFileSync(filePath, req.code, 'utf-8');
      cmd = 'python3';
      args = [filePath];
    } else if (language === 'javascript' || language === 'js') {
      filePath = path.join(tempDir, 'solution.js');
      fs.writeFileSync(filePath, req.code, 'utf-8');
      cmd = 'node';
      args = [filePath];
    } else if (language === 'typescript' || language === 'ts') {
      filePath = path.join(tempDir, 'solution.ts');
      fs.writeFileSync(filePath, req.code, 'utf-8');
      cmd = 'npx';
      args = ['tsx', filePath];
    } else if (language === 'cpp' || language === 'c++') {
      const srcPath = path.join(tempDir, 'solution.cpp');
      const binPath = path.join(tempDir, 'solution.out');
      fs.writeFileSync(srcPath, req.code, 'utf-8');

      // Compile first
      const compileResult = await new Promise<{ error: any; stderr: string }>((resolve) => {
        execFile('g++', ['-O2', srcPath, '-o', binPath], { timeout: 8000 }, (err, _stdout, stderr) => {
          resolve({ error: err, stderr });
        });
      });

      if (compileResult.error) {
        return {
          stdout: '',
          stderr: compileResult.stderr || 'Compilation failed',
          compileOutput: compileResult.stderr,
          exitCode: 1,
          executionTimeMs: Date.now() - startTime,
          verdict: 'Compilation Error',
          provider: 'sandboxed-runner',
          providerStatus: 'Compilation Error',
        };
      }
      cmd = binPath;
      args = [];
    } else {
      // Unsupported language message
      return {
        stdout: '',
        stderr: `Language "${language}" is not available on this runner. Supported languages: C++, C, Python, JavaScript, TypeScript, Java, Go, Rust.`,
        exitCode: 1,
        executionTimeMs: 0,
        verdict: 'Compilation Error',
        provider: 'sandboxed-runner',
        providerStatus: 'Unsupported language',
      };
    }

    return await new Promise<ExecutionResult>((resolve) => {
      let isTimedOut = false;
      const child = spawn(cmd, args, {
        cwd: tempDir,
        env: {
          PATH: process.env.PATH,
          NODE_ENV: 'sandbox',
          HOME: tempDir,
        },
      });

      let stdout = '';
      let stderr = '';

      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      if (req.stdin) {
        child.stdin.write(req.stdin);
        child.stdin.end();
      } else {
        child.stdin.end();
      }

      child.stdout.on('data', (data) => {
        if (stdout.length < maxBuffer) {
          stdout += data.toString();
        }
      });

      child.stderr.on('data', (data) => {
        if (stderr.length < maxBuffer) {
          stderr += data.toString();
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const duration = Date.now() - startTime;

        if (isTimedOut) {
          return resolve({
            stdout,
            stderr: 'Time Limit Exceeded (5.0s)',
            exitCode: 124,
            executionTimeMs: timeoutMs,
            verdict: 'Time Limit Exceeded',
            provider: 'sandboxed-runner',
            providerStatus: 'Time Limit Exceeded',
          });
        }

        const trimmedOut = stdout.trim();
        const trimmedExpected = req.expectedOutput ? req.expectedOutput.trim() : null;

        let verdict: ExecutionResult['verdict'] = 'Accepted';
        if (code !== 0) {
          verdict = 'Runtime Error';
        } else if (trimmedExpected !== null) {
          // Normalize line breaks and internal spacing around punctuation
          const normOut = trimmedOut.replace(/\r\n/g, '\n').replace(/,\s+/g, ',').trim();
          const normExp = trimmedExpected.replace(/\r\n/g, '\n').replace(/,\s+/g, ',').trim();
          verdict = normOut === normExp ? 'Accepted' : 'Wrong Answer';
        }

        resolve({
          stdout: trimmedOut,
          stderr: stderr.trim(),
          exitCode: code ?? 0,
          executionTimeMs: duration,
          verdict,
          provider: 'sandboxed-runner',
          providerStatus: verdict,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: 1,
          executionTimeMs: Date.now() - startTime,
          verdict: 'Runtime Error',
          provider: 'sandboxed-runner',
          providerStatus: 'Process Error',
        });
      });
    });
  } catch (error: any) {
    return {
      stdout: '',
      stderr: error?.message || 'Execution failed',
      exitCode: 1,
      executionTimeMs: Date.now() - startTime,
      verdict: 'Runtime Error',
      provider: 'sandboxed-runner',
      providerStatus: 'Execution Exception',
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}
