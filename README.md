![NestJS 2FA/MFA Module](https://raw.githubusercontent.com/enteocode/nestjs-mfa/master/resources/assets/nestjs-mfa.logo.svg)

[![Build Status](https://github.com/enteocode/nestjs-mfa/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/enteocode/nestjs-mfa/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue)][L]
[![Coverage](https://coveralls.io/repos/github/enteocode/nestjs-mfa/badge.svg?branch=master)](https://coveralls.io/github/enteocode/nestjs-mfa?branch=master)

RFC‑compliant Multi‑Factor Authentication (2FA/MFA) module for [NestJS][N], built on [otplib][O]. Pluggable storage, QR 
codes, recovery codes, and event‑driven architecture.

## Table of Contents

- [Requirements and Peer Dependencies](#requirements-and-peer-dependencies)
- [Features](#features)
- [Installation](#installation)
- [Module Registration](#module-registration)
- [Usage](#usage)
- [QR Code](#qr-code)
- [Advanced Usage](#advanced-usage)
- [Events](#events)
- [Compliance](#compliance)

## Requirements and Peer Dependencies

- [NodeJS][J] (version 20 or above)
- [Keyv][K]
- [Event Emitter][E]
- [NestJS][N] (version 9 or above)

## Features

- **Context-aware**: HTTP, RPC, WebSocket, etc.
- **Services**: Registration, validation, QR generation, recovery
- **Security**: Encrypted storage
- **Extensible**: Pluggable extractors, decorators, and event hooks
- **Optimized**: Streamable QR codes, low memory footprint

## Installation

```shell
npm i -S @enteocode/nestjs-mfa
```

## Module Registration

Configure using `forRoot` or `forRootAsync`, according to NestJS standards:

`app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MfaModule } from '../src';
import { createKeyv } from '@keyv/redis';

@Module({
    imports: [
        MfaModule.forRoot({
            // Displayed in authenticator apps
            issuer: 'My Application',
            
            // Persistent key-value adapter for KeyV
            store: createKeyv(/* ... */),
            
            // AES-256-GCM
            cipher: 'my-32-byte-encryption-key'
        })
    ]
})
export class AppModule {}
```

> **Important:** The `EventEmitterModule` must be registered.

### Configuration

| Name         | Type                  | Required | Default | Description                         |
|--------------|-----------------------|----------|---------|-------------------------------------|
| `issuer`     | `string`              | Yes      | –       | App name for authenticator display  |
| `store`      | `Keyv`                | Yes      | –       | Persistent key-value store          |
| `ttl`        | `number`              | No       | `30`    | TOTP token lifetime (seconds)       |
| `serializer` | `SerializerInterface` | No       | `V8`    | Data serialization (JSON, V8, etc.) |  
| `cipher`     | `string`              | No       | –       | AES-256 key for encrypted storage   |

> **Hint**: Provide a `cipher` to protect user secrets according to **[NIS2][E2]** and **[GDPR][E1]** standards

### Store

**Persistent storage is required.**

Supported Keyv adapters: [Etcd][KE], [Memcache][KM], [Mongo][KO], [MySQL][KY], [Postrgres][KP], [Redis][KR], [SQLite][KS], [Valkey][KV].

## Usage

After registration, you can use the `MfaService` to implement it to your setup by injecting it to your service or
controller.

### HTTP

`mfa.controller.ts`

```typescript
import { Body, Controller, InternalServerErrorException, ParseUUIDPipe, Post, StreamableFile } from '@nestjs/common';
import { Format, MfaService, TokenType } from '@enteocode/nestjs-mfa';
import { TokenVerificationRequest } from './mfa.token-verification.request.ts';

@Controller('mfa')
class MfaController {
    constructor(private readonly mfa: MfaService) {}

    @Post('enable/:user')
    public async enable(@Param('user', ParseUUIDPipe) user: string): Promise<StreamableFile> {
        const secret = await this.mfa.enable(user);

        if (!secret) {
            throw new InternalServerErrorException('Cannot enable MFA for user');
        }
        return this.mfa.generate(user, TokenType.AUTHENTICATOR, Format.PNG);
    }

    @Post('verify')
    public async verify(@Body() { user, token }: TokenVerificationRequest): Promise<boolean> {
        return this.mfa.verify(user, token);
    }
}
```

### Validation DTO

`token-verification.request.ts`

```typescript
import { IsUUID } from 'class-validator';
import { IsToken, Token } from '@enteocode/nestjs-mfa';
 
// ValidationPipe based flow
 
export class TokenVerificationRequest {
    @IsUUID()
    user: string;
    
    @IsToken() // Built-in validator
    token: Token;
}
```

### Microservices

`mfa.controller.ts`

```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
class MfaController {
    constructor(private readonly mfa: MfaService) {}
    
    @MessagePattern({ cmd: 'mfa.enable '})
    public async enable(@Payload() user: string): Promise<string> {
        /* ... */
    }
}
```

## QR Code

The QR code contains a [Key URI][G], originally defined by Google for its Authenticator app and later adopted by other
authenticator applications. This URI encodes the secret along with key properties (such as account name and issuer) and
is used to register the authenticator with a user’s device.

Conceptually, it's similar to asymmetric cryptography: the secret acts like a private key, and the app uses it to
generate public one-time codes.

You can choose to generate the QR code on the client side or the backend side:

- Client-side generation reduces backend load and cost.
- Backend-side generation is handled by the module using streamed rendering to keep memory and CPU usage minimal.

QR codes are only required for the initial pairing with the authenticator app.

### Example

`mfa.authenticator.controller.ts`

```typescript
import { Controller, Get, Param, ParseUUIDPipe, StreamableFile } from '@nestjs/common';
import { MfaService, TokenType } from '@enteocode/nestjs-mfa';

@Controller('mfa/generate')
class MfaAuthenticatorController {
    constructor(private readonly mfa: MfaService) {}

    @Get(':user/qr')
    public generateQrCode(@Param('user', ParseUUIDPipe) user: string): Promise<StreamableFile> {
        return this.mfa.generate(user, TokenType.AUTHENTICATOR, Format.WEBP)
    }

    @Get(':user/uri')
    public generateKeyUri(@Param('user', ParseUUIDPipe) user: string): Promise<string> {
        return this.mfa.generate(user, TokenType.AUTHENTICATOR)
    }
    
    @Get(':user/token')
    public generateToken(@Param('user', ParseUUIDPipe) user: string): Promise<string> {
        // Manual token creation instead of authenticator
        // Useful to generate one-time password for email based second factor
        
        return this.mfa.generate(user, TokenType.TIMEOUT, { step: 5 * 60, digits: 8 })
    }
}
```

### Formats

| Format | Avg. Size | MIME Type    |
|--------|-----------|--------------|
| WebP   | 242B      | `image/webp` |
| PNG    | 406B      | `image/png`  |
| AVIF   | 674B      | `image/avif` |
| JPEG   | 3.7KB     | `image/jpeg` |

> **Note**: Sizes measured with test data, actual results may vary

## Advanced Usage

### Credential Extractors

To avoid manually verifying tokens across multiple endpoints, you can implement credential extractors. These provide a
context-specific mechanism for extracting credentials (such as user ID and token) and feeding them into a parameter
decorator. This makes the solution reusable, streamlined, and transport-agnostic (HTTP, RPC, WebSockets, etc.).

> **Hint:** you can create multiple extractors and the first one will be ued which supports the
> actual `ExecutionContext`.

### Example

An example of a HTTP extractor, that gets credentials from the header, with the pattern:

`HTTP Header`

```
X-MFA: otp://user:012345@authenticator
```

`mfa.http.credentials-extractor.ts`

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { MfaCredentialsExtractor, MfaCredentialsExtractorInterface } from '@enteocode/nestjs-mfa';

@MfaCredentialsExtractor('http')
@Injectable()
class MfaHttpCredentialsExtractor implements MfaCredentialsExtractorInterface {
    public supports(context: ExecutionContext): boolean {
        return Boolean(this.getHeader(context));
    }

    public getUserIdentifier(context: ExecutionContext): Identifier {
        return URL.parse(this.getHeader(context)).username;
    }

    public getToken(context: ExecutionContext): Token {
        return URL.parse(this.getHeader(context)).password;
    }
    
    // Helper
    
    private getHeader(context: ExecutionContext, header: string = 'x-mfa'): string {
        return context.switchToHttp().getRequest<FastifyRequest>().headers[header];
    }
}
```
> **Hint:** If you leave the `MfaCredentialsExtractor` decorator's parameter empty, it will be called to check support
> on every context.

You have to add this extractor to your list of providers to be part of the Dependency Injection container in order to 
be detectable.  
You are ready to use:

`mfa.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { MfaCredentials, MfaCredentialsInterface } from '@enteocode/nestjs-mfa';

@Controller()
class MfaController {
    @Get()
    public async login(@MfaCredentials({ required: true, validate: true }) credentials: MfaCredentialsInterface) {
        // credentials.user     [Identifier]    The unique identifier of the user (email, UUID, etc.)
        // credentials.token    [Token]         The 6-digit token
    }
}
```

> **Hint**: All options are optional, credentials will be automatically validated if `validate` is `true`

## Events

### Authentication Events

| Event          | Payload                            | Description            |
|----------------|------------------------------------|------------------------|
| `mfa.enabled`  | `{ user: string, secret: string }` | MFA activated for user |
| `mfa.disabled` | `{ user: string }`                 | MFA deactivated        |
| `mfa.failed`   | `{ user: string, token: string }`  | Invalid token provided |

### Recovery Events

| Event                   | Payload                               | Description                   |
|-------------------------|---------------------------------------|-------------------------------|
| `mfa.recovery.enabled`  | `{ user: string, codes: Set<string>}` | Backup codes generated        |
| `mfa.recovery.disabled` | `{ user: string }`                    | Backup codes deleted          |
| `mfa.recovery.used`     | `{ user: string, code: string }`      | Backup code consumed          |
| `mfa.recovery.failed`   | `{ user: string, code: string }`      | Backup code validation failed |

### Example

`app.event-listener.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthenticationFailedEvent, EventType } from '@enteocode/nestjs-mfa';

@Injectable()
class AppEventListener {
    @OnEvent(EventType.AUTHENTICATION_FAILED)
    onMfaAuthenticationFailed(event: AuthenticationFailedEvent) {
        // Block user after 5 attempts
    }
}
```

## Compliance

- [RFC 3548](http://tools.ietf.org/html/rfc3548)
- [RFC 4648](https://tools.ietf.org/html/rfc4648)
- [RFC 6238](http://tools.ietf.org/html/rfc6238)
- [NIS2][E2] / [GDPR][E1] compliance with encryption

## License

[MIT][L] © 2025, [Ádám Székely][A]


[A]: https://www.linkedin.com/in/enteocode/
[J]: https://nodejs.org/
[K]: https://keyv.org/
[G]: https://github.com/google/google-authenticator/wiki/Key-Uri-Format
[E]: https://docs.nestjs.com/techniques/events
[N]: https://nestjs.com/
[O]: https://www.npmjs.com/package/otplib
[L]: http://www.opensource.org/licenses/MIT

[E1]: https://commission.europa.eu/law/law-topic/data-protection_en
[E2]: https://nis2directive.eu/

[KE]: https://keyv.org/docs/storage-adapters/etcd/
[KM]: https://keyv.org/docs/storage-adapters/memcache/
[KY]: https://keyv.org/docs/storage-adapters/mysql/
[KO]: https://keyv.org/docs/storage-adapters/mongo/
[KR]: https://keyv.org/docs/storage-adapters/redis/
[KP]: https://keyv.org/docs/storage-adapters/postgres/
[KS]: https://keyv.org/docs/storage-adapters/sqlite/
[KV]: https://keyv.org/docs/storage-adapters/valkey/

