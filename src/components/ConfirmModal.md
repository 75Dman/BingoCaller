# ConfirmModal Component — Reference

**Location:** `src/components/ConfirmModal.js`

**Purpose:**
- A themed, reusable confirmation modal used across the app for warnings and confirmations.
- Replaces native `confirm()` dialogs to provide a consistent, branded UI with the "Bingo Caller Pro" bingo-ball icon.

## Props
- `open` (boolean) — whether the modal is shown
- `title` (string) — title text displayed beside the icon (default: `Confirm`)
- `children` (node) — content (message) rendered beneath the title
- `onConfirm()` — callback fired when the user confirms
- `onCancel()` — callback fired when the user cancels
- `confirmLabel` (string) — label for confirm button (default: `Continue`)
- `cancelLabel` (string) — label for cancel button (default: `Cancel`)

## Usage
Inline usage example:

```jsx
<ConfirmModal open={!!pending} title="Bingo Caller Pro" onConfirm={doConfirm} onCancel={doCancel}>
  Are you sure you want to continue?
</ConfirmModal>
```

**Notes:** Use this modal whenever you previously used `window.confirm()` to keep behavior consistent and accessible.
