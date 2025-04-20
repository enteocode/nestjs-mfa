import { Global, Injectable, InternalServerErrorException, PipeTransform } from '@nestjs/common';
import { MfaService } from '../mfa.service';
import { MfaCredentialsExtractorManager } from './mfa.credentials.extractor.manager';

import type { MfaCredentialsContext } from './mfa.credentials.decorator';
import type { MfaCredentialsDecoratorOptionsInterface } from './mfa.credentials.decorator.options.interface';
import type { MfaCredentialsInterface } from './mfa.credentials.interface';

@Injectable()
@Global()
export class MfaCredentialsPipe implements PipeTransform {
    constructor(
        private readonly manager: MfaCredentialsExtractorManager,
        private readonly service: MfaService
    ) {}

    async transform({ options, context }: MfaCredentialsContext): Promise<MfaCredentialsInterface> {
        const { required, validate } = this.getOptions(options);

        const extractor = this.manager.resolve(context);

        if (!extractor && required) {
            throw new InternalServerErrorException('No credentials extractor for the given context', {
                cause: context.getType()
            });
        }
        if (!extractor) {
            return null;
        }
        const user = extractor.getUserIdentifier(context);
        const token = extractor.getToken(context);

        if (validate) {
            await this.service.verify(user, token);
        }
        return { user, token };
    }

    private getOptions(options?: MfaCredentialsDecoratorOptionsInterface): MfaCredentialsDecoratorOptionsInterface {
        const base: MfaCredentialsDecoratorOptionsInterface = {
            required: false,
            validate: false
        };

        if (!options) {
            return base;
        }
        return { ...base, ...options };
    }
}
