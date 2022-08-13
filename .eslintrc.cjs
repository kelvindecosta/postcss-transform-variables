module.exports = {
	env: {
		node: true,
		es6: true
	},

	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
	plugins: ['@typescript-eslint', 'import'],

	parser: '@typescript-eslint/parser',

	rules: {
		'no-console': 'warn',
		'sort-imports': ['warn', { ignoreDeclarationSort: true }],

		'import/order': [
			'warn',
			{
				groups: ['builtin', 'external', 'internal', 'parent', ['sibling', 'index']],
				'newlines-between': 'always',
				alphabetize: { order: 'asc', caseInsensitive: true }
			}
		]
	},

	ignorePatterns: ['*.cjs']
};
