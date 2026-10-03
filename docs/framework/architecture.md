# Architecture

## 1. Purpose

This repository exists to build and maintain a solid, reusable foundation for developing React Native applications.

The main reusable framework is `packages/alambre`. It provides generic infrastructure and capabilities that are useful across applications, such as theming, language management, animation systems, data/API infrastructure, and other reusable application foundations.

The repository may also contain example applications, prototypes, and validation projects. These applications are primarily used to exercise the framework, expose weaknesses, and guide its evolution.

The goal is not to build a framework that attempts to solve every possible application need. The framework should remain focused on reusable infrastructure and abstractions.

---


## 2. Project Structure

The main conceptual boundaries are:

* `packages/alambre` — the reusable framework.
* `apps/*` — example, validation, and prototype applications used to exercise and evolve the framework.
* `docs/` — project documentation and architectural knowledge.

The repository also contains:

* `apps/colguetti` — the reference application: a real product built on `alambre` that exercises the framework, exposes weaknesses, and guides its evolution. Prototyping for potential framework capability happens here first.
* `apps/cross-logic` — logic puzzle game application validating game sessions, history state, and grid models.
* `apps/base-template` — the application template: a generic, product-free skeleton on top of `alambre`, intended to provide a solid, opinionated starting point for future applications. It is rebuilt when lessons from the reference application make the wiring worth updating, and its canonical standalone copy is published as the GitHub template repository `marcosdima/base-expo` (regenerated with `scripts/export-template.sh`). Apps bootstrapped with *"Use this template"* depend on the published `alambre` package (npm/pnpm) and are independent from this repository.
* `apps/playground` — the interactive proving ground: an isolated environment for testing animation parameters, toast behaviors, edge cases, and UI primitives without cluttering the starter template.

An application created from the template should be able to evolve independently from `apps/base-template` and from this repository.

---


## 3. Architecture Principles

### 3.1 Dependency direction

Dependencies must flow from applications toward reusable packages.

Applications may depend on `alambre`.

`alambre` must not depend on application-specific code.

The framework should remain usable without knowing anything about a particular application, prototype, or product.

### 3.2 Reuse without speculation

A capability should belong in `alambre` when it represents genuinely reusable application infrastructure.

Examples include concepts such as:

* language management
* theming
* animation infrastructure
* configuration
* reusable data/API infrastructure
* other generic application foundations

Potential reuse alone is not sufficient justification for introducing an abstraction.

When reuse is uncertain, prefer implementing and validating the idea in an application first.

### 3.3 Framework boundaries

`alambre` should provide reusable infrastructure and abstractions, not attempt to become a general-purpose library containing every solution an application might need.

Application-specific behavior belongs in applications.

UI or domain concepts should only become part of the framework when there is a clear and justified reusable concept behind them.

### 3.4 Preserve established concepts

Existing architectural decisions should be respected.

An implementation may be improved, simplified, refactored, or replaced when the underlying architectural concept remains intact.

However, replacing an established concept with a fundamentally different one is an architectural decision and must not be done implicitly.

---

