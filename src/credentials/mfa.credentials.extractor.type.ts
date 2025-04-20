import type { ContextType } from '@nestjs/common';

export type MfaCredentialsExtractorType = string | (ContextType | 'all');
