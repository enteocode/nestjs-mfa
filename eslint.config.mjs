import { globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * ESLint configuration (according to new definition requirements)
 */
export default tslint.config(
    globalIgnores([
        // Source related folders

        'dist/',
        'resources/',
        'test/',

        // Deployment configuration

        'rollup.config.mjs'
    ]),
    eslint.configs.recommended,
    tslint.configs.recommended,
    prettier,
    {
        rules: {
            '@typescript-eslint/interface-name-prefix': 0,
            '@typescript-eslint/ban-types': 0,
            '@typescript-eslint/explicit-function-return-type': 0,
            '@typescript-eslint/explicit-module-boundary-types': 0,
            '@typescript-eslint/no-explicit-any': 0
        }
    }
);
