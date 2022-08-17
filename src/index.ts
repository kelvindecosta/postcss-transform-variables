import type { Plugin, PluginCreator } from 'postcss';

import { name } from '../package.json';

/**
 * Options for the plugin.
 */
export type Options = {
  /**
   * Will be applied on the identifier of each custom property.
   */
  transform?: (fields: { identifier?: string; filepath?: string; rawCss?: string }) => string;
  /**
   * Whether to warn on collisions; when the identifiers of two custom properties transform to the same new identifier.
   */
  warnOnDetectCollision?: boolean;
  /**
   * Whether to warn when a non-deterministic `transform` is detected; when two new identifiers are transformed from the identifier of the same custom property.
   */
  warnOnDetectNonDeterminism?: boolean;
};

/**
 * Defaults for each option.
 */
const defaultOptions: Required<Options> = {
  transform: ({ identifier }) => identifier as string,
  warnOnDetectCollision: true,
  warnOnDetectNonDeterminism: true
};

/**
 * A shortened `JSON.stringify`.
 */
const s = JSON.stringify;

/**
 * Removes the double hyphen prefix, `--`, from an identifier, if present.
 * @param identifier - symbol of the custom property.
 * @returns - identifier without the double hyphen.
 */
const removeDoubleHyphenPrefix = (identifier: string) => identifier.replace(/^--/, '');

/**
 * Adds the double hyphen prefix, `--`, to an identifier.
 * @param identifier - symbol of the custom property.
 * @returns - identifier with the double hyphen.
 */
const addDoubleHyphenPrefix = (identifier: string) => `--${identifier}`;

/**
 * `postcss` plugin that transforms identifiers of CSS custom properties.
 * @param options - options for the plugin.
 */
const pluginCreator: PluginCreator<Options> = (options) => {
  // Resort to defaults, if necessary
  const { transform, warnOnDetectCollision, warnOnDetectNonDeterminism } = {
    ...defaultOptions,
    ...options
  };

  // Track mappings
  const mapOldToNew = new Map<string, string>();
  const mapNewToOld = new Map<string, string>();

  // Track warnings
  const detectedCollidingIdentifiers = new Set<string>();
  const detectedNonDeterministicIdentifiers = new Set<string>();

  // Function that is invoked once every `postcss` listener has been invoked
  const processor: NonNullable<Plugin['OnceExit']> = (root, { result }) => {
    const applyTransform = (oldIdentifier: string): string => {
      // Call user defined transform
      const newIdentifier = addDoubleHyphenPrefix(
        removeDoubleHyphenPrefix(
          transform({
            identifier: removeDoubleHyphenPrefix(oldIdentifier),
            filepath: root.source?.input.file,
            rawCss: root.source?.input.css
          })
        )
      );

      let resultIdentifier = newIdentifier;

      // Check for non-deterministic transforms
      const previouslyTransformedNewIdentifier = mapOldToNew.get(oldIdentifier);
      const isNonDeterministicTransform =
        previouslyTransformedNewIdentifier && previouslyTransformedNewIdentifier !== newIdentifier;

      if (isNonDeterministicTransform) {
        if (warnOnDetectNonDeterminism) {
          // Set result as identifier from previous transform
          resultIdentifier = previouslyTransformedNewIdentifier;

          // Warn if necessary
          if (!detectedNonDeterministicIdentifiers.has(oldIdentifier)) {
            detectedNonDeterministicIdentifiers.add(oldIdentifier);

            result.warn(
              `The custom property ${s(oldIdentifier)} cannot transform to ${s(
                newIdentifier
              )} as it is already set to transform to ${s(previouslyTransformedNewIdentifier)}!`
            );
          }
        }
      } else {
        mapOldToNew.set(oldIdentifier, newIdentifier);
      }

      // Check for colliding transforms
      const previouslyTransformedOldIdentifier = mapNewToOld.get(newIdentifier);
      const isCollidingTransform =
        previouslyTransformedOldIdentifier && previouslyTransformedOldIdentifier !== oldIdentifier;

      if (isCollidingTransform) {
        if (warnOnDetectCollision) {
          // Set result to identifier without transform
          resultIdentifier = oldIdentifier;

          if (!detectedCollidingIdentifiers.has(oldIdentifier)) {
            detectedCollidingIdentifiers.add(oldIdentifier);

            result.warn(
              `The custom property ${s(oldIdentifier)} cannot transform to ${s(
                newIdentifier
              )} as ${s(previouslyTransformedOldIdentifier)} is already set to transform to ${s(
                newIdentifier
              )}!`
            );
          }
        }
      } else {
        mapNewToOld.set(newIdentifier, oldIdentifier);
      }

      return resultIdentifier;
    };

    root.walkDecls((decl) => {
      // Change the custom property declaration
      decl.prop = decl.prop.replace(/--[A-z][\w-]*/g, applyTransform);

      // Change the custom property usage
      decl.value = decl.value.replace(/--[A-z][\w-]*/g, applyTransform);
    });
  };

  return {
    postcssPlugin: name,
    OnceExit: processor
  };
};

export default pluginCreator;

pluginCreator.postcss = true;

module.exports = pluginCreator;
