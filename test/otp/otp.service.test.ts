import { Test } from '@nestjs/testing';
import { OtpService } from '../../src/otp.service';

describe('OtpService', () => {
    let service: OtpService;

    beforeEach(async () => {
        const ref = await Test.createTestingModule({ providers: [OtpService] }).compile();

        service = ref.get(OtpService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should produce an RFC 4648 compliant Base32 string', () => {
        expect(service.generateSecret()).toMatch(/^[A-Z2-7]+$/);
    });

    it('should produce an RFC 3548 compliant secret', () => {
        expect(service.generateSecret().length).toBeGreaterThanOrEqual(16);
    });

    it('should produce an RFC 4226 compliant secret', () => {
        expect(service.generateSecret().length).toBeGreaterThanOrEqual(26);
    });

    it('should generate a time-base token', () => {
        const secret = service.generateSecret();

        expect(service.generateToken(secret)).toHaveLength(6);
        expect(service.generateToken(secret, { digits: 8 })).toHaveLength(8);
    });

    it('should pass token validation if within timeframe', () => {
        const secret = service.generateSecret();
        const token = service.generateToken(secret);

        expect(service.verify(secret, token)).toBe(true);
    });

    it('should fail token validation if timeout passed', async () => {
        const secret = service.generateSecret();
        const token = service.generateToken(secret, { step: 0.01 });

        await new Promise((resolve) => setTimeout(resolve, 30));

        expect(service.verify(secret, token)).toBe(false);
    });

    it('should generate a key-uri for authenticator applications', () => {
        const secret = service.generateSecret();
        const issuer = 'Enteocode';
        const uri = service.generateKeyUri(secret, issuer, 'MFA Test User');
        const url = URL.parse(uri);

        expect(url).toHaveProperty('protocol', 'otpauth:');
        expect(url).toHaveProperty('hostname', 'totp');
        expect(url).toHaveProperty('pathname', encodeURI('/Enteocode:MFA Test User'));
        expect(url.searchParams.get('secret')).toBe(secret);
        expect(url.searchParams.get('issuer')).toBe(issuer);
        expect(url.searchParams.get('digits')).toBe('6');
        expect(url.searchParams.get('period')).toBe('30');
    });
});
