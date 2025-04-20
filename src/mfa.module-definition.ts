import { ConfigurableModuleBuilder } from '@nestjs/common';

import type { MfaModuleOptionsInterface } from './mfa.module.options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<MfaModuleOptionsInterface>()
        .setClassMethodName('forRoot')
        .setExtras({ isGlobal: true })
        .build();
