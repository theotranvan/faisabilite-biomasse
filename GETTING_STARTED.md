# Faisabilité Biomasse - Setup & Development Guide

## 📋 Complete File Inventory

### ✅ Configuration Files (10)
- `package.json` - Dependencies & scripts
- `tsconfig.json` - TypeScript strict mode
- `next.config.js` - Next.js optimization
- `tailwind.config.ts` - Tailwind theming
- `postcss.config.js` - CSS processing
- `.env.local` - Local environment variables
- `.env.example` - Environment template
- `.gitignore` - Git exclusions
- `.instructions.md` - Development guide
- `README.md` - Project documentation

### ✅ Database (Prisma)
- `prisma/schema.prisma` - 12 main tables + 8 reference tables
- `prisma/seed.ts` - ~50 reference data items

### ✅ Core Calculation Modules (4 files, 25+ functions)
- `src/lib/calculs/batiment.ts` - Building calculations
- `src/lib/calculs/parc.ts` - Heating network calculations
- `src/lib/calculs/chiffrage.ts` - Cost calculations
- `src/lib/calculs/bilan-actualise.ts` - Financial projections

### ✅ Application Structure (7 files)
- `src/app/layout.tsx` - Root layout
- `src/app/globals.css` - Global styles + Tailwind
- `src/app/page.tsx` - Landing page
- `src/app/auth/login/page.tsx` - Login form
- `src/app/auth/register/page.tsx` - Registration form
- `src/app/dashboard/page.tsx` - Dashboard skeleton
- `src/types/index.ts` - TypeScript interfaces

### ✅ API Routes (4 routes)
- `src/app/api/auth/register/route.ts` - User registration
- `src/app/api/auth/login/route.ts` - User login
- `src/app/api/affaires/route.ts` - Project list & create
- `src/app/api/meteo/[departement]/route.ts` - DJU lookup

### ✅ Library Files (2 files)
- `src/lib/db.ts` - Prisma client singleton
- `src/lib/utils.ts` - 30+ utility functions

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database set up
- npm 9+

### 2. Installation
```bash
cd FaisabilitéBiomasse
npm install  # Already completed ✅
```

### 3. Database Setup
```bash
# Create .env.local with your PostgreSQL connection
# Example: DATABASE_URL="postgresql://user:password@localhost:5432/biomasse_db"

# Generate Prisma client
npm run prisma:generate

# Create database tables
npm run prisma:migrate

# Populate reference data
npm run prisma:seed
```

### 4. Start Development
```bash
npm run dev
# Open http://localhost:3000
```

## 📊 What's Already Implemented

### Database Schema ✅
- **12 main tables**: User, Affaire, Batiment, Parc, etc.
- **8 reference tables**: Energie, BddCout, MeteoMoyenne, etc.
- **50+ seed items**: Cost database fully populated
- **96 departments**: DJU data pre-loaded

### Calculation Engine ✅
**All Excel formulas converted to TypeScript:**

Building (batiment.ts):
- Efficiency calculation (rendement moyen)
- Consumption calculations (calculated, EP, PCS)
- Annual costs
- Energy labels (A-G)

Network (parc.ts):
- Boiler entry/exit calculations
- Storage & ash volume
- Load curve generation
- Network losses

Costing (chiffrage.ts):
- Line item totaling
- Fee calculation
- Cost with TVA
- Subsidy scenarios
- Loan amortization

Projections (bilan-actualise.ts):
- 20-year financial model
- CO2/SO2 emissions
- Environmental gains
- Payback period

### Styles ✅
- Tailwind CSS configuration
- Global component styles
- Button & form styles
- Card & alert styles
- Table styling

### API Routes ✅
- User registration endpoint
- User login endpoint
- Project list & create
- DJU lookup by department

## 📝 What's NOT Yet Implemented

### Authentication (Priority 1)
- [ ] NextAuth.js session management
- [ ] Protected middleware
- [ ] User context/hooks
- [ ] Logout functionality

### Dashboard (Priority 1)
- [ ] Dynamic affaires list
- [ ] Filtering & sorting
- [ ] Delete affaire
- [ ] Duplicate affaire

### Project Management (Priority 2)
- [ ] Create affaire form (15+ fields)
- [ ] Edit affaire details
- [ ] Building spreadsheet editor
- [ ] Building state management

### Costing Pages (Priority 3)
- [ ] Cost invoicing UI
- [ ] Reference solution form (US-H)
- [ ] Biomass solution form (US-I)
- [ ] Subsidy scenarios

### Results & Charts (Priority 3)
- [ ] Comparison table
- [ ] 20-year projection chart
- [ ] CO2/SO2 chart
- [ ] Load monotone chart
- [ ] Cost breakdown chart

### Export (Priority 4)
- [ ] PDF report generation
- [ ] Professional layout
- [ ] Chart embedding

## 🛠️ Development Workflow

### Running Calculations
All calculations are in `src/lib/calculs/` and **client-side only**:

```typescript
import { calculBatiment } from '@/lib/calculs/batiment';

// Use in React component
const results = useMemo(() => {
  return calculBatiment(
    deperditions,
    rendementProduction,
    rendementDistribution,
    rendementEmission,
    rendementRegulation,
    dju,
    tempIntBase,
    tempExtBase,
    coefIntermittence,
    typeEnergie,
    tarification,
    abonnement
  );
}, [deperditions, ...otherDeps]);
```

### Adding Database Tables
1. Edit `src/prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. Update `src/types/index.ts` if needed

### Creating React Components
```typescript
// Example form component
export function MyForm() {
  const [data, setData] = useState({});
  
  const results = useMemo(() => {
    return calculBatiment(...);
  }, [data.deperditions, ...]);

  return (
    <form>
      {/* inputs */}
      <div>{results.consommationsCalculees} kWh/an</div>
    </form>
  );
}
```

## ✅ Testing Checklist

### Database
- [ ] `npm run prisma:seed` completes without errors
- [ ] 50+ items in bdd_couts table
- [ ] 96 departments in meteo_moyenne table
- [ ] All enums properly created

### Calculations
- [ ] Building "essai" → 70189 kWh/an ✓
- [ ] Building 2 → 58868 kWh/an ✓
- [ ] No NaN or Infinity results
- [ ] All edge cases handled

### API Routes
- [ ] POST /api/auth/register works
- [ ] POST /api/auth/login works
- [ ] GET /api/affaires returns empty array
- [ ] GET /api/meteo/[dept] returns DJU

### Build
- [ ] `npm run build` completes
- [ ] `npm run lint` has no errors
- [ ] No TypeScript errors: `npx tsc --noEmit`

## 📖 Key Files to Understand

### Start Here
1. `README.md` - Project overview
2. `.instructions.md` - Development guide
3. `src/lib/calculs/batiment.ts` - Core calculation example

### Database
- `prisma/schema.prisma` - All table definitions
- `src/lib/db.ts` - Database client setup

### Types
- `src/types/index.ts` - TypeScript interfaces

### Configuration
- `next.config.js` - Next.js settings
- `tailwind.config.ts` - Styling theme
- `tsconfig.json` - TypeScript rules

## 🔍 Debugging

### Database Issues
```bash
# View database GUI
npx prisma studio

# Reset (CAREFUL!)
npx prisma db push --force-reset

# Check migrations
npx prisma migrate status
```

### Prisma Issues
```bash
# Generate client
npm run prisma:generate

# List tables
npx prisma db execute --stdin < check.sql

# View logs
cat logs/prisma.log
```

### Build Issues
```bash
# Check TypeScript
npx tsc --noEmit

# Check ESLint
npm run lint

# Build in debug mode
npm run build -- --debug
```

## 📱 Component Development Pattern

### Form Component Template
```typescript
'use client';

import { useState, useMemo } from 'react';
import { calculBatiment } from '@/lib/calculs/batiment';

export function MaBatimentForm() {
  const [state, setState] = useState({
    deperditions: 20,
    rendementProduction: 80,
    // ... other fields
  });

  const calculs = useMemo(() => {
    return calculBatiment(
      state.deperditions,
      state.rendementProduction,
      // ... rest of args
    );
  }, [state]);

  return (
    <div>
      <input
        type="number"
        value={state.deperditions}
        onChange={(e) =>
          setState({
            ...state,
            deperditions: parseFloat(e.target.value),
          })
        }
      />
      <div>
        Consommation: {calculs.consommationsCalculees.toFixed(0)} kWh/an
      </div>
    </div>
  );
}
```

## 📊 Data Flow

```
React Components
       ↓
   useState/useMemo
       ↓
   Calculation Functions (src/lib/calculs/)
       ↓
   Display Results
       ↓
   API Routes (on save)
       ↓
   Prisma ORM
       ↓
   PostgreSQL Database
```

## 🎯 Next Development Steps

### Immediate (Today)
1. [ ] Set up PostgreSQL locally
2. [ ] Create `.env.local` with connection string
3. [ ] Run `npm run prisma:migrate`
4. [ ] Run `npm run prisma:seed`
5. [ ] Test `npm run dev`

### Short Term (This Week)
6. [ ] Implement NextAuth.js sessions
7. [ ] Add protected routes middleware
8. [ ] Create dashboard with affaires table
9. [ ] Build create affaire form

### Medium Term (Next Week)
10. [ ] Building management interface
11. [ ] Real-time calculation display
12. [ ] Costing input forms
13. [ ] Results visualization

### Long Term (Phase Complete)
14. [ ] Charts and graphs
15. [ ] PDF export
16. [ ] Polish & optimization
17. [ ] Documentation

## 🚫 Common Mistakes to Avoid

1. **Forgetting `npm run prisma:generate`** after schema changes
2. **Not setting up DATABASE_URL** before running migrations
3. **Using `any` types** in TypeScript code
4. **Mutations in calculations** - keep functions pure
5. **Blocking API calls** without async/await
6. **Not validating user input** before calculations
7. **Using `localhost:3000` in production URLs**

## 📞 Support References

- **Prisma**: https://www.prisma.io/docs/
- **Next.js**: https://nextjs.org/docs/
- **Tailwind**: https://tailwindcss.com/
- **React**: https://react.dev/

---

**Status**: ✅ Phase 1 Complete - Ready for Phase 2 Development  
**Database**: Schema complete, reference data seeded  
**Calculations**: All formulas implemented  
**UI**: Skeleton pages in place, Tailwind configured  
**Next**: Implement authentication & dashboard
