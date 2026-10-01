# Handoff: Migración a Arquitectura Headless (Agent-First DX)

Este documento resume las decisiones arquitectónicas y el estado del código para la nueva sesión del Agente Principal (`@lead`).

## 1. El Cambio de Paradigma (Agent-First)
Pasamos de un framework "artesanal/personal" a una **caja de herramientas diseñada para que Agentes de IA construyan sin alucinar**.
* **Problema anterior:** El uso excesivo de `Context Providers` obligaba a anidar componentes (`<ConfigProvider><ToastProvider>...`), generando dependencias implícitas frágiles para los agentes (crashes de `useX must be used within...`) y re-renders innecesarios. Las vistas monolíticas (ej. `CarouselCard` con estilos quemados) causaban que los agentes pelearan contra el CSS.
* **Nueva Arquitectura:** 
  1. **External Stores para Servicios Globales:** Toast, Confirm, Config, Lang, Theme y API ahora usan `useSyncExternalStore` (vía `core/use-external-store.ts`). Ya no usan React Context. Se exponen funciones reactivas directas (ej. `toast.show()`).
  2. **Hooks Headless para UI:** Los comportamientos locales (Carruseles, Decks, Acordeones) serán hooks matemáticos/físicos (`useCarousel`) sin estilos predefinidos. El agente pone su propio JSX en la app.

## 2. El Modelo de Agentes (Squad Model)
* **Límite Estricto del `@lead`:** El `@lead` tiene prohibido tocar código de aplicación (`.ts`, `.tsx`, `src/`). Su herramienta `replace_file_content` está restringida **solo a `docs/` y `.agents/`** para documentar y diseñar. El código lo escriben `@ui` y `@tester`.
* **Nuevo Agente `@ax` (Agent Experience):** Creamos un "crash-test dummy". Su único rol es intentar usar nuestras nuevas APIs headless leyendo solo la documentación pública. Si el `@ax` falla o alucina, la API está mal diseñada para IA.

## 3. Estado Actual del Repositorio
* **Rama:** `refactor/headless-architecture`
* **Logros:**
  * Se guardó el progreso de `apps/playground/src/views/containers` (el laboratorio).
  * Se refactorizaron y eliminaron los Context Providers de: `toast`, `confirm`, `config`, `lang`, `light-dark`, `collection` y `api`.
  * Se borró el viejo `core/create-provider.tsx`.
* **TAREA PENDIENTE INMEDIATA:**
  * El archivo `packages/alambre/src/behaviors/api/create-api.ts` contiene JSX (`<QueryClientProvider>`) pero se guardó como `.ts`. Esto rompe el `pnpm typecheck`.
  * **Acción:** Renombrar `create-api.ts` a `create-api.tsx`, verificar que `api/index.ts` exporte correctamente, correr `pnpm --filter alambre typecheck` y hacer el commit.

## Instrucciones para la Nueva Sesión
1. Lee este `HANDOFF.md`.
2. Delega a `@tester` o `@ui` la corrección de `create-api.ts`.
3. Una vez que el código compile, retoma el diseño de los "Containers" (Carruseles, Decks) en `apps/playground/` extrayendo la lógica física hacia hooks headless en `packages/alambre`.
