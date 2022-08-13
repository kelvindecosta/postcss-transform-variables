# postcss-transform-variables

[![Version](https://img.shields.io/npm/v/postcss-transform-variables)](https://github.com/postcss/postcss-transform-variables/blob/master/CHANGELOG.md)
[![PostCSS Compatibility](https://img.shields.io/npm/dependency-version/postcss-transform-variables/peer/postcss)](https://postcss.org/)
[![Tests](https://github.com/kelvindecosta/postcss-transform-variables/actions/workflows/node.js.yml/badge.svg)](https://github.com/kelvindecosta/postcss-transform-variables/actions/workflows/ci.yml)

[PostCSS] plugin that transforms identifiers of [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*).

[postcss]: https://github.com/postcss/postcss

## Example

```diff
 :root {
-	--kd-padding-y: 2px;
-	--kd-padding-x: 4px;
+	--padding-y: 2px;
+	--padding-x: 4px;
 }

 p {
-	padding-block: var(--kd-padding-y) var(--kd-padding-x);
+	padding-block: var(--padding-y) var(--padding-x);
 }
```

## Installation

```bash
# NPM
npm i -D postcss-transform-variables

# Yarn
yarn i -D postcss-transform-variables

# pnpm
pnpm i -D postcss-transform-variables
```

## Usage

Include `postcss-transform-variables` in the PostCSS configuration (eg: `postcss.config.js`).

```js
module.exports = {
	plugins: [
		require('postcss-transform-variables')({
			transform: ({ identifier }) => `web-${identifier}`
		})
	]
};
```

## Options

### `transform`

Will be applied on the identifier of each custom property.

#### Type: `Function`

##### Arguments:

- `fields`:
  - `identifier`: the name of the custom property without the double hyphen (`--`)
  - `filepath`: the path to the file
  - `rawCss`: the `css` string

##### Returns: `string`

#### Default: `({ identifier}) => identifier`

### `warnOnDetectCollision`

Whether to warn on collisions; when the identifiers of two custom properties transform to the same new identifier.

#### Type: `boolean`

#### Default: `true`

### `warnOnDetectNonDeterminism`

Whether to warn when a non-deterministic `transform` is detected; when two new identifiers are transformed from the identifier of the same custom property.

#### Type: `boolean`

#### Default: `true`
