import fs from 'fs';

import MurmurHash from 'imurmurhash';
import postcss from 'postcss';

import plugin from '../dist';
import type { Options } from '../dist';

const loadCSSFromCase = (name: string) =>
	fs.readFileSync(`${__dirname}/__fixtures__/${name.replace(/\s+/g, '-')}.css`, 'utf8');

describe('options', () => {
	const run = (options?: Options) => () =>
		postcss([plugin(options)]).process('', { from: undefined });

	it('can be omitted', () => {
		expect(run()).not.toThrow();
		expect(run({})).not.toThrow();
	});
});

describe.each<{ name: string; transform: Options['transform'] }>([
	{
		name: 'without a double hyphen',
		transform: ({ identifier }) => `kd-${identifier}`
	},
	{
		name: 'with a double hyphen',
		transform: ({ identifier }) => `--kd-${identifier}`
	}
])('transform $name', ({ transform }) => {
	const run = (input: string) =>
		postcss([plugin({ transform })]).process(input, { from: undefined }).css;

	const cases = [
		'a single variable',
		'a single variable used multiple times',
		'a single variable with a fallback',
		'a single variable using another',
		'multiple variables',
		'multiple variables in a single property',
		'multiple variables inside functions'
	];

	it.each(cases)('should handle %s', (type) => {
		const input = loadCSSFromCase(type);

		expect(run(input)).toMatchSnapshot();
	});
});

describe('collisions', () => {
	const input = loadCSSFromCase('multiple variables');
	const transform: Options['transform'] = ({ identifier }) => `kd-${identifier?.substring(0, 2)}`;

	const run = (warnOnDetectCollision: Options['warnOnDetectCollision']) => () =>
		postcss([plugin({ transform, warnOnDetectCollision })]).process(input, {
			from: undefined
		});

	it('can be logged as warnings', () => {
		const result = run(true)();
		expect(result.warnings().length).toBe(1);
		expect(result.css).toMatchSnapshot();
	});
	it('can be ignored', () => {
		const result = run(false)();
		expect(result.warnings().length).toBe(0);
		expect(result.css).toMatchSnapshot();
	});
});

describe('non-determinism', () => {
	const input = loadCSSFromCase('a single variable used multiple times');
	const hash = MurmurHash();
	const transform: Options['transform'] = ({ identifier }) =>
		`kd-${hash
			.hash(identifier as string)
			.result()
			.toString(16)}`;

	const run = (warnOnDetectNonDeterminism: Options['warnOnDetectNonDeterminism']) => () =>
		postcss([plugin({ transform, warnOnDetectNonDeterminism })]).process(input, {
			from: undefined
		});

	it('can be logged as warnings', () => {
		const result = run(true)();
		expect(result.warnings().length).toBe(1);
		expect(result.css).toMatchSnapshot();
	});
	it('can be ignored', () => {
		const result = run(false)();
		expect(result.warnings().length).toBe(0);
		expect(result.css).toMatchSnapshot();
	});
});
