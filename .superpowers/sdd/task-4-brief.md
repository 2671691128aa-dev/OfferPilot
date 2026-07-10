### Task 4: CSS Animation Utilities

**Files:**
- Modify: `frontend/src/index.css:183-192` (append new keyframes and utilities)

- [ ] **Step 1: Add animation CSS to `index.css`**

Append before the `prefers-reduced-motion` media query block (before line 183):

```css
/* ─── Streaming fade-up animation ─── */

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 200ms ease-out both;
  will-change: transform, opacity;
}

/* ─── Streaming pop-in animation ─── */

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-pop-in {
  animation: pop-in 200ms ease-out both;
  will-change: transform, opacity;
}
```

Also update the `prefers-reduced-motion` block to include the new animations:

```css
/* ─── Reduced motion ─── */

@media (prefers-reduced-motion: reduce) {
  .orb,
  .card-lift,
  .btn-shine::after,
  .animate-fade-up,
  .animate-pop-in {
    animation: none !important;
    transition: none !important;
  }
  .animate-fade-up,
  .animate-pop-in {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add fade-up and pop-in animation CSS utilities"
```

---

