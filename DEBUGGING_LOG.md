# Debugging Log - Familie Todo App

Dette dokumentet registrerer feil, løsninger og lærdommer fra utviklingen av familie todo-appen.

## 2024-06-09: TypeScript Type Import Error i ES Modules

### Problem
**Feilmelding:** 
```
completionService.ts:1 Uncaught SyntaxError: The requested module '/src/models/index.ts' does not provide an export named 'TaskCompletion' (at completionService.ts:1:10)
```

**Symptomer:**
- Hvit skjerm i browser
- Module import feil i browser console
- TypeScript kompilerer uten feil, men runtime feiler
- Problemet oppstod etter implementering av Task 6 (completion workflow)

### Rotårsak
**Primær årsak:** Sirkulær avhengighet mellom `completionService` og `taskService`
- `completionService` importerte `taskService` for validering
- Dette skapte module loading corruption i Vite

**Sekundær årsak:** Feil import-syntax for TypeScript types
- Brukte `import { TaskCompletion }` for TypeScript types
- I ES modules må types importeres med `import type { TaskCompletion }`
- Runtime prøvde å finne TypeScript types som faktiske verdier

### Løsningsprosess

#### Steg 1: Fikset sirkulær avhengighet
```typescript
// FØR (completionService.ts)
import { TaskCompletion } from '@/models'
import { storage } from '@/lib/storage'
import { taskService } from './taskService' // <- Sirkulær avhengighet

// Validering brukte taskService.validateTaskCompletion()

// ETTER
import { TaskCompletion } from '@/models'  
import { storage } from '@/lib/storage'
// Fjernet taskService import

// Erstattet med enkel validering:
if (!completionData.taskId || !completionData.userId) {
  throw new CompletionServiceError(
    'Task ID and User ID are required for completion', 
    'INVALID_COMPLETION'
  )
}
```

#### Steg 2: Ryddet Vite cache
```bash
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist
rm -rf node_modules/.tmp/
```

#### Steg 3: Fikset TypeScript type imports
Endret alle filer fra:
```typescript
import { TaskCompletion } from '@/models'  // ❌ Feil
```
Til:
```typescript
import type { TaskCompletion } from '@/models'  // ✅ Korrekt
```

**Berørte filer:**
- `src/services/completionService.ts`
- `src/services/taskService.ts`
- `src/services/userService.ts`
- `src/services/familyService.ts`
- `src/services/streakService.ts`
- `src/services/rewardService.ts`
- `src/services/seedData.ts`
- `src/stores/taskStore.ts`
- `src/stores/userStore.ts`
- `src/stores/familyStore.ts`

### Lærdommer

#### 1. Sirkulære avhengigheter
- **Problem:** Service-lag kan lett få sirkulære avhengigheter
- **Løsning:** Bruk dependency injection eller shared utilities
- **Unngå:** Cross-service imports for validering

#### 2. ES Modules vs TypeScript Types
- **Regel:** Bruk `import type` for alle TypeScript type imports
- **Grunn:** Types eksisterer kun på compile-time, ikke runtime
- **Vite:** Strikt på ES module compliance

#### 3. Cache-problemer
- **Symptom:** Feil persisterer etter kodefix
- **Løsning:** Alltid rydd cache når module structure endres
- **Kommandoer:**
  ```bash
  rm -rf node_modules/.vite
  rm -rf node_modules/.tmp/
  pkill -f "vite"
  npm run dev
  ```

#### 4. Debugging-tilnærming
1. **Identifiser rotårsak** - ikke bare symptomer
2. **Fikse systematisk** - en ting av gangen
3. **Verifiser løsning** - test at TypeScript kompilerer
4. **Rydd cache** - sørg for clean start

### Fremtidige anbefalinger

#### Import-struktur
```typescript
// ✅ Korrekt struktur
import React from 'react'                    // Runtime libraries
import { someFunction } from './utilities'   // Runtime values  
import type { SomeType } from './types'      // TypeScript types
```

#### Service-arkitektur
- Unngå cross-service imports
- Bruk shared utilities for validering
- Vurder dependency injection pattern

#### Debugging-checklist
1. [ ] Sjekk for sirkulære avhengigheter
2. [ ] Verifiser import/export syntax
3. [ ] Rydd alle caches
4. [ ] Test TypeScript compilation
5. [ ] Restart development server

### Verktøy for å unngå problemet
```bash
# Sjekk sirkulære avhengigheter
npx dpdm --tree --warning false src/**/*.{ts,tsx}

# Verifiser TypeScript
npx tsc --noEmit

# Reset utviklingsmiljø
rm -rf node_modules/.vite && npm run dev
```

---
*Dato: 9. juni 2024*
*Utvikler: Claude*
*Prosjekt: Familie Todo App*