export interface MfaCredentialsDecoratorOptionsInterface {
    /**
     * If set to true, then throws UnauthorizedException if it cannot resolve
     * credentials from the actual context
     *
     * @default false
     */
    required?: boolean;

    /**
     * If set to true, it validates the resolved credentials
     *
     * @default false
     */
    validate?: boolean;
}
