import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { AuthService } from '../auth.service';
import { RolesGuard } from './roles.guard';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';

// Resolve the existing absolute import in Jest without changing the production guard.
jest.mock('apps/gamenix-api/src/libs/enums/common.enum', () =>
    jest.requireActual('../../../libs/enums/common.enum'), { virtual: true });

describe('Existing RolesGuard behavior preserved', () => {
    const auth = new AuthService(new JwtService({ secret: 'shop-guard-test-secret' }));
    const reflector = { get: jest.fn() };
    let guard: RolesGuard;
    let request: any;
    let context: any;

    beforeEach(() => {
        guard = new RolesGuard(reflector as any, auth);
        request = { headers: {}, body: {} };
        context = { contextType: 'graphql', getArgByIndex: () => ({ req: request }), getHandler: () => undefined };
        reflector.get.mockReturnValue([MemberType.ADMIN]);
    });

    it.each([MemberType.USER, MemberType.SHOP])('denies a %s token access to existing ADMIN operations', async (memberType) => {
        request.headers.authorization = `Bearer ${await auth.createToken({ _id: new Types.ObjectId(), memberType } as any)}`;
        await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('retains existing ADMIN token authorization', async () => {
        request.headers.authorization = `Bearer ${await auth.createToken({ _id: new Types.ObjectId(), memberType: MemberType.ADMIN } as any)}`;
        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('retains role-only SHOP checks: PENDING status is not enforced by this unchanged guard', async () => {
        reflector.get.mockReturnValue([MemberType.SHOP]);
        request.headers.authorization = `Bearer ${await auth.createToken({
            _id: new Types.ObjectId(), memberType: MemberType.SHOP, memberStatus: MemberStatus.PENDING,
        } as any)}`;
        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('retains rejection of missing and invalid tokens', async () => {
        await expect(guard.canActivate(context)).rejects.toThrow();
        request.headers.authorization = 'Bearer invalid';
        await expect(guard.canActivate(context)).rejects.toThrow();
    });
});
