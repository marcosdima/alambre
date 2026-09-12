# Architecture

This document defines the architectural principles and boundaries of `alambre`.

The architecture is intentionally evolving. Current implementation details, experiments, and unvalidated abstractions should not be considered architectural decisions unless explicitly adopted.

---

## 1. Purpose

`alambre` is a reusable framework for React Native applications.

Its purpose is to provide reusable infrastructure, behavior, and contracts for problems that are likely to recur across applications.

Alambre is not intended to:

* replace React Native
* compete with mature ecosystem solutions
* become an exhaustive UI library
* become a complete design system
* introduce abstractions merely for the sake of abstraction

---

## 2. Framework and application boundary

The fundamental boundary is:

> **Alambre provides reusable functionality, behavior, contracts, and infrastructure. The application provides presentation, identity, and product-specific decisions.**

Alambre should solve problems that are genuinely reusable across applications.

Application-specific decisions should remain in the application whenever they do not need to be centralized.

This distinction is especially important for UI, where reusable behavior should be separated from application-specific presentation.

---

## 3. Abstraction criteria

An abstraction should be introduced when it solves a recurring problem that is valuable to centralize.

The guiding question is:

> Does this solve a repetitive behavior or infrastructure problem worth centralizing?

If clearly yes, it is a candidate for Alambre.

If uncertain, prototype it at the application level first.

If the concept itself is not yet clear, do not freeze the abstraction prematurely.

---

## 4. Architectural flexibility

Alambre capabilities do not need to share a single internal architecture.

Different problems may justify different approaches.

Architectural uniformity is not a goal by itself.

An implementation mechanism should be chosen according to the requirements of the capability rather than forcing every capability into a common pattern.

Current implementation patterns are therefore not automatically architectural decisions.

---

## 5. Ecosystem-first

When React Native, Expo, or a mature ecosystem library already solves a problem well, Alambre should prefer using or integrating with that solution rather than maintaining a competing implementation.

Custom infrastructure should exist when it provides meaningful reusable value beyond what the ecosystem already provides.

---

## 6. UI direction

Alambre may provide reusable UI primitives, but it is not intended to become a complete component library or design system.

UI primitives should provide meaningful reusable behavior rather than merely wrapping React Native components.

The general separation is:

**Alambre**

* behavior
* interaction contracts
* reusable state handling
* accessibility behavior
* composable functionality

**Application**

* colors
* typography
* dimensions
* spacing
* visual variants
* brand identity
* concrete icons
* application-specific animations

Composition should remain simple and favor React's existing composition mechanisms.

Exceptions must be explicit decisions, recorded in `docs/ui.md`. One exception is already adopted: concrete icons may remain in `alambre` when they are presentation-neutral contracts — the application still owns colors, dimensions, and animation (see `docs/ui.md` §2).

---

## 7. Evolution

Architectural decisions should be driven by demonstrated needs and validated patterns.

The current implementation may contain:

* experiments
* transitional abstractions
* prototypes
* legacy code
* implementation details that have not yet been validated

These should not automatically become architectural constraints.

When a proposed change affects an architectural principle or boundary, it should be discussed before implementation.

Otherwise, implementation details may be freely simplified, reorganized, replaced, or removed when doing so improves the project without changing the agreed architecture.
