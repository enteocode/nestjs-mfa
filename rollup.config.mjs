import typescript from '@rollup/plugin-typescript';
import clean from 'rollup-plugin-delete';
import terser from '@rollup/plugin-terser';

/*
 * Build Process (Rollup)
 *
 * Deployment process with Tree-Shaking and code optimization
 *
 * @private
 * @author Ádám Székely (https://www.linkedin.com/in/enteocode/)
 */

/**
 * Build process configurations
 *
 * @type import('rollup').RollupOptions
 */
const config = {
    input: './src/index.ts',
    output: [
        {
            file: './dist/index.mjs',
            format: 'es',
            sourcemapExcludeSources: true,
            sourcemap: true,
            validate: true
        },
        {
            file: './dist/index.js',
            format: 'cjs',
            sourcemapExcludeSources: true,
            sourcemap: true,
            validate: true
        },
    ],
    external: [
        /^node:/,

        /^@nestjs\//,
        /^@otplib\//,

        'keyv',
        'qrcode',
        'sharp',
        'class-validator',
        'uuid'
    ],
    plugins: [
        clean({
            targets: ['dist/*'],
            runOnce: true
        }),
        typescript({
            rootDir: 'src',
            outputToFilesystem: true,
            declaration: true,
            declarationDir: './dist/types',
        }),
        terser({
            keep_classnames: true,
            sourceMap: true
        })
    ]
};

export default config;
