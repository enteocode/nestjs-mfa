export enum TokenType {
    /**
     * Usable only in a time-widow multiple times
     */
    TIMEOUT = 'timeout',

    /**
     * Usable with an authenticator application (time based with auto-regeneration)
     */
    AUTHENTICATOR = 'authenticator'
}
