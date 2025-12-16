## 2024-05-23 - Linting & Testing State
**Learning:** The codebase has a significant number of existing linting errors (500+). Future optimizations should isolate checks to modified files (`eslint src/ModifiedFile.tsx`) to avoid noise.
**Action:** When verifying, use specific file paths for linting.
