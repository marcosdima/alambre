# alambre

`alambre` is a React Native utility library focused on reusable providers, small UI helpers, and navigation/testing playgrounds.

This repository currently includes a working test app (`tests/`) where providers and components are exercised in real screens.

## Current Scope

- Provider factories to keep feature logic encapsulated:
	- `createConfigProvider`
	- `createLangProvider`
	- `createLightDarkProvider`
	- `createApiProvider` (powered by TanStack Query)
- Navigation test flow with nested pages (`home`, `configuration`, `advance`, `play`)
- Toast provider integration
- Theme switching (light/dark) with persisted storage
- API playground in tests:
	- typed route catalog
	- generated query/mutation hooks from route definitions
	- route execution demo and structured response rendering

## Project Structure (high level)

- `src/`: library source code
- `tests/`: demo/testing app code used to validate behavior
- `App.tsx`: wires providers and test screens together

## Quick Start

Install dependencies:

```bash
npm install
```

Run the test app (Expo):

```bash
npm run android
```

Other useful scripts:

```bash
npm run lint
npm run build
```

## Notes

This README is intentionally short for now.
More detailed API docs and usage examples can be added later as the library surface stabilizes.