# Contributions

Any and all contributions are welcome! This is a decently sized project with a good scoped of functionality.

## How to Contribute

1. Create a fork of the repository
2. Clone the code to your local machine
3. Create a new branch with the feature you are working on with the issue number (e.g. issue/42)
4. Run `npm i`
5. Implement your changes, ensure tests are still passing, or add tests if it is a new feature
6. Push back to your version on GitHub
7. Raise a Pull Request to the main repository

## Development

All the source code is in `src` as expected. Most of the code should be rather self documented. Follow TDD principles,
create the unit-test first, then run `npm run test:watch ./test/your-feature.test.ts` or without filename for fixes.

## Testing

Use `npm run test:watch` to run all test suites and watch for changes.

## Commits

We are using [Conventional Commit](https://github.com/conventional-changelog/commitlint) to help keep commit messages
aligned as development continues. Once you've made your commit, prettier and eslint will run and ensure that the new
code is up to the standards we have in place.
