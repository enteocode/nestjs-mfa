import { registerDecorator, ValidatorOptions } from 'class-validator';

/**
 * Class validator decorator (for ValidationPipe)
 *
 * @public
 * @param options
 * @constructor
 */
export function IsToken(options?: ValidatorOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            name: 'IsToken',
            options,
            propertyName,
            validator: {
                defaultMessage() {
                    return 'Invalid MFA token';
                },

                validate(value: any) {
                    return Boolean(value && typeof value === 'string' && value.match(/[0-9]{6}/));
                }
            }
        });
    };
}
