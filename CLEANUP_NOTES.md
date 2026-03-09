# 📋 Cleanup Instructions - lib/calculs Legacy Code

## Current State (Before Cleanup)

The application has duplicate calculation code in two locations:

```
lib/calculs/ (LEGACY - NOT USED IN PRODUCTION)
├── batiment.ts
├── bilan.ts
├── chiffrage.ts
├── isolation.ts
├── monotone.ts
├── parc.ts
└── types.ts

src/lib/calculs/ (ACTIVE - USED IN PRODUCTION)
├── batiment.ts
├── bilan-actualise.ts
├── chiffrage.ts
├── isolation.ts
├── parc.ts
└── (isolated functions)
```

## Why lib/calculs is Legacy

1. **Not imported by frontend**: All React components use `@/lib/calculs` (resolves to `src/lib/calculs`)
2. **Only used by tests**: Files in `/tests` and `/scripts` reference `../lib/calculs` but these are not production code
3. **Path alias configuration**: `tsconfig.json` defines `@/*` → `./src/*`, making `src/lib` the canonical location

## Cleanup Steps (Optional)

The following steps would provide cleaner code (no functional impact):

1. **Delete legacy lib/calculs/ directory**
   ```bash
   rm -rf lib/
   ```

2. **Update test imports** (if tests are to be run):
   ```typescript
   // Change from:
   import { ... } from '../lib/calculs/batiment';
   // To:
   import { ... } from './src/lib/calculs/batiment';
   ```

3. **Add .gitignore entry** (if not already present):
   ```
   # Legacy code - do not use
   lib/
   ```

## Current Status

- ✅ Frontend production code: Uses `src/lib/calculs/` only
- ✅ No functional duplication in active code
- ✅ Tests reference legacy code but don't affect production

## Decision

The application is **100% clean** for production purposes.  
The legacy `lib/calculs/` directory can:
- **Remain** (takes minimal disk space, no impact on build)
- **Be deleted** (if pruning unneeded files is desired)

## Impact

Deleting `lib/calculs/` has:
- ✅ Zero impact on production code
- ✅ Zero impact on frontend application
- ⚠️ Minor impact: Tests and scripts won't run (but they're not part of CI/CD anyway)

### Recommendation

**Leave it as-is for now.** If stricter code hygiene is needed:
1. Move or delete in a separate cleanup PR
2. Update tests to use new paths if needed
3. Document decision in ARCHITECTURE.md
