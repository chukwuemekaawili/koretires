
## Fix: Tire Size Filter Not Matching All Formats

### The Problem
Your database has tires in two different size formats:
- `265/70/17` (slash before rim size) 
- `LT265/70R17` (R before rim size)

The current search filter only recognizes the "R17" format, so the `265/70/17` tires don't appear when filtering.

### The Solution
Update the tire size parsing logic in the Shop page to handle both formats:
- `/70R17` (standard format with R)
- `/70/17` (alternate format with slash)

### Technical Details

**File:** `src/pages/ShopPage.tsx`

**Changes to filtering logic:**

1. **Aspect ratio regex** - Update to match both `/70R` and `/70/` patterns:
   - Current: `/\/(\d{2,3})(?:\.5)?R/`
   - New: `/\/(\d{2,3})(?:\.5)?(?:R|\/)/`

2. **Rim size regex** - Update to match both `R17` and `/17` patterns:
   - Current: `/R(\d{2})/`
   - New: `/(?:R|\/)(\d{2})$/`

This ensures searching for Width: 265, Aspect: 70, Rim: 17 will return both `265/70/17` AND `LT265/70R17` products.

### Result
After this fix, all 4 products for the 265/70/17 size will appear in search results - the 3 in-stock non-LT variants plus the LT placeholder.
