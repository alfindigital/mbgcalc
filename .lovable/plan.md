

# Plan: Counting-Up Animation + Slider Input

## 1. Counting-Up Animation (Animated Counter)

**Approach:** Create a custom `useAnimatedNumber` hook that uses `requestAnimationFrame` to interpolate from old value to new value over ~400ms with ease-out.

### New hook: `useAnimatedNumber(target, duration)`
- Tracks previous value via `useRef`
- On target change, animates from previous → new using `requestAnimationFrame`
- Returns current interpolated number
- Uses ease-out curve: `1 - (1-t)^3`

### Changes to `ResultCard`
- Use `useAnimatedNumber` for the primary result value
- Use it for each breakdown row value
- Format the animated number the same way (sig digits, rupiah format)
- Since the unit label can change (e.g., "Detik" → "Menit"), handle unit transitions by resetting animation when unit changes

### Implementation detail
- The hook works on raw numeric values (pre-format)
- Pass `totalMs` into the hook, then derive display values from the animated ms value
- This way all breakdown rows animate in sync from a single animated source

## 2. Slider Input

**Approach:** Add a styled range slider below the input field using the existing Radix `Slider` component.

### Changes to `Index` component
- Add a `<Slider>` component between the input field and the quick amount buttons
- Range: 0 to 1,000,000,000,000 (1 Trillion)
- Use logarithmic scale for usability (linear scale would make small values impossible to select)
  - Slider position 0-100 maps to `10^(position/100 * 12)` (0 → 1, 100 → 1T)
  - Minimum meaningful value: when slider > ~threshold, otherwise 0
- Sync bidirectionally: typing updates slider position, sliding updates input
- Show formatted tick labels: "0", "1Jt", "1M", "1T" at key positions

### Slider styling
- Use existing `Slider` component from `src/components/ui/slider.tsx`
- Override track color to use brand primary (#003366)
- Add subtle labels below: "Rp 0" on left, "Rp 1T" on right
- Thumb gets a pulse animation on first render to hint interactivity

### Files to modify
1. **`src/pages/Index.tsx`** — Add `useAnimatedNumber` hook, integrate slider, update ResultCard
2. **`src/index.css`** — Add any needed animation keyframes for the counter (digit transition)

