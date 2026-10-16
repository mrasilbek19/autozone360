import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

const testConfig = (values: Record<string, string>) => ({ get: (key: string) => values[key] } as ConfigService);
const captureConfig = () => testConfig({ NODE_ENV: 'test', MAIL_TRANSPORT: 'capture' });
const smtpConfig = (changes = {}) => testConfig({
    NODE_ENV: 'development', MAIL_TRANSPORT: 'smtp', MAIL_FROM: 'no-reply@example.test',
    SMTP_HOST: 'smtp.example.test', SMTP_PORT: '587', SMTP_USER: 'fixture-user', SMTP_PASS: 'fixture-password', ...changes,
});

afterEach(() => jest.restoreAllMocks());

describe('MailService capture transport', () => {
    it('captures verification mail without SMTP and escapes dynamic HTML', async () => {
        const mail = new MailService(captureConfig());
        const link = 'https://frontend.example.test/account/verify-email#token=fixture&other="value"';
        await mail.sendEmailVerification('owner@example.test', '<img src=x>&"\'', link);
        const [message] = mail.getCapturedMessages();
        expect(message.to).toBe('owner@example.test');
        expect(message.html).toContain('&lt;img src=x&gt;&amp;&quot;&#39;');
        expect(message.html).not.toContain('<img');
        expect(message.html).toContain('&amp;other=&quot;value&quot;');
        expect(message.text).toContain(link);
        mail.onModuleDestroy();
        expect(mail.getCapturedMessages()).toEqual([]);
    });

    it('bounds capture storage and never exposes a mutable message reference', async () => {
        const mail = new MailService(captureConfig());
        for (let index = 0; index < 25; index++) {
            await mail.sendMail({ to: 'owner@example.test', subject: String(index), html: '<p>test</p>', text: 'test' });
        }
        const captured = mail.getCapturedMessages();
        expect(captured).toHaveLength(20);
        captured[0].text = 'changed';
        expect(mail.getCapturedMessages()[0].text).toBe('test');
        mail.onModuleDestroy();
    });
});

describe('MailService configuration and SMTP failures', () => {
    it.each([
        { NODE_ENV: 'production', MAIL_TRANSPORT: 'capture' },
        { NODE_ENV: 'test', MAIL_TRANSPORT: 'smtp' },
        { MAIL_TRANSPORT: 'unknown' },
        { MAIL_FROM: 'invalid' }, { SMTP_HOST: '' }, { SMTP_HOST: 'https://smtp.example.test' },
        { SMTP_PORT: 'abc' }, { SMTP_PORT: '0' }, { SMTP_PORT: '65536' },
        { SMTP_USER: '' }, { SMTP_PASS: '' },
    ])('fails safely for invalid configuration %j', (changes) => {
        expect(() => new MailService(smtpConfig(changes))).toThrow();
    });

    it.each([465, 587])('configures certificate-checked TLS for SMTP port %s without connecting', (port) => {
        const create = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ close: jest.fn() } as any);
        const mail = new MailService(smtpConfig({ SMTP_PORT: String(port) }));
        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            secure: port === 465, requireTLS: port !== 465, tls: { rejectUnauthorized: true },
            logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
        }));
        expect(mail.getCapturedMessages()).toEqual([]);
        mail.onModuleDestroy();
    });

    it('reports transport failures without logging provider secrets or message content', async () => {
        jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
            sendMail: jest.fn().mockRejectedValue(new Error('provider-private-fixture')), close: jest.fn(),
        } as any);
        const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        const mail = new MailService(smtpConfig());
        await expect(mail.sendEmailVerification('owner@example.test', 'Owner', 'https://example.test/#secret'))
            .rejects.toThrow('Email delivery is temporarily unavailable');
        expect(JSON.stringify(log.mock.calls)).not.toContain('provider-private-fixture');
        expect(JSON.stringify(log.mock.calls)).not.toContain('owner@example.test');
        mail.onModuleDestroy();
    });
});
