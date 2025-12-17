## 2024-12-14 - Form Accessibility & Validation
**Learning:** Standard shadcn/ui Input components in this repo don't automatically render visual "required" indicators or character counts, relying on manual implementation.
**Action:** When adding forms, manually wrap labels with visual indicators (`text-red-500 *`) and standard `aria-required` attributes to ensure screen reader users and visual users both perceive mandatory fields.
