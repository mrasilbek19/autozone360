import { JwtService } from '@nestjs/jwt';
import { createConnection, Types } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { MemberService } from './member.service';
import MemberSchema from '../../schemas/Member.model';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';

describe('Minimal SHOP registration and existing admin approval', () => {
    const connection = createConnection();
    const MemberModel = connection.model('ShopApprovalTestMember', MemberSchema);
    const auth = new AuthService(new JwtService({ secret: 'shop-approval-test-secret' }));
    const memberId = new Types.ObjectId() as any;
    let model: any;
    let service: MemberService;
    const credentials = () => ({ memberNick: 'gamer', memberPassword: 'password123', memberPhone: '12345678' });

    beforeEach(() => {
        model = {
            create: jest.fn(async (input) => {
                const member = new MemberModel(input);
                await member.validate();
                return member;
            }),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn().mockReturnValue({ exec: async () => ({ _id: memberId, memberType: MemberType.SHOP, memberStatus: MemberStatus.ACTIVE }) }),
            aggregate: jest.fn().mockReturnValue({ exec: async () => [{ list: [], metaCounter: [] }] }),
        };
        service = new MemberService(model, {} as any, auth, {} as any, {} as any);
    });
    afterAll(async () => { await connection.close(); });

    it('preserves USER signup defaults, bcrypt hashing and existing JWT fields', async () => {
        const result = await service.signup(credentials());
        expect(result.memberType).toBe(MemberType.USER);
        expect(result.memberStatus).toBe(MemberStatus.ACTIVE);
        expect(result.memberProducts).toBe(0);
        expect(result.memberPassword).not.toBe('password123');
        await expect(auth.comparePassword('password123', result.memberPassword)).resolves.toBe(true);
        const token = await auth.verifyToken(result.accessToken);
        expect(token.memberType).toBe(MemberType.USER);
        expect(String(token._id)).toBe(String(result._id));
        expect(token.memberPassword).toBeUndefined();
    });

    it('creates SHOP/PENDING through the existing signup without requiring a new upload', async () => {
        const result = await service.signup({ ...credentials(), memberType: MemberType.SHOP });
        expect(result.memberType).toBe(MemberType.SHOP);
        expect(result.memberStatus).toBe(MemberStatus.PENDING);
        expect((await auth.verifyToken(result.accessToken)).memberStatus).toBe(MemberStatus.PENDING);
    });

    it('rejects public ADMIN signup before creating a member', async () => {
        await expect(service.signup({ ...credentials(), memberType: MemberType.ADMIN })).rejects.toThrow();
        expect(model.create).not.toHaveBeenCalled();
    });

    it.each([
        [MemberType.USER, MemberStatus.ACTIVE],
        [MemberType.SHOP, MemberStatus.PENDING],
        [MemberType.SHOP, MemberStatus.ACTIVE],
    ])('preserves username/password login for %s/%s', async (memberType, memberStatus) => {
        const member = { _id: memberId, memberType, memberStatus, memberPassword: await auth.hashPassword('password123') };
        model.findOne.mockReturnValue({ select: () => ({ exec: async () => member }) });
        const result = await service.login({ memberNick: 'gamer', memberPassword: 'password123' });
        expect(model.findOne).toHaveBeenCalledWith({ memberNick: 'gamer' });
        expect((await auth.verifyToken(result.accessToken)).memberStatus).toBe(memberStatus);
    });

    it('preserves wrong-password and blocked-account login rejection', async () => {
        const member = { memberStatus: MemberStatus.ACTIVE, memberPassword: await auth.hashPassword('password123') };
        model.findOne.mockReturnValue({ select: () => ({ exec: async () => member }) });
        await expect(service.login({ memberNick: 'gamer', memberPassword: 'wrong-password' })).rejects.toThrow();
        member.memberStatus = MemberStatus.BLOCK;
        await expect(service.login({ memberNick: 'gamer', memberPassword: 'password123' })).rejects.toThrow();
    });

    it.each([{ memberType: MemberType.ADMIN }, { memberType: MemberType.SHOP }, { memberStatus: MemberStatus.ACTIVE }])('denies privileged self-update %j', async (fields) => {
        await expect(service.updateMember(memberId, { _id: memberId, ...fields })).rejects.toThrow();
        expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('preserves ordinary member profile updates, including memberImage paths', async () => {
        const input = { _id: memberId, memberNick: 'gamer', memberImage: 'uploads/member/existing-image.png' };
        await service.updateMember(memberId, input);
        expect(model.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: memberId, memberStatus: MemberStatus.ACTIVE }, input, { new: true },
        );
    });

    it('lists pending shops using the existing admin query filters', async () => {
        await service.getAllMembersByAdmin({ page: 1, limit: 10, search: { memberType: MemberType.SHOP, memberStatus: MemberStatus.PENDING } });
        expect(model.aggregate.mock.calls[0][0][0]).toEqual({ $match: { memberType: MemberType.SHOP, memberStatus: MemberStatus.PENDING } });
    });

    it('approves through the existing admin status update operation', async () => {
        const input = { _id: memberId, memberStatus: MemberStatus.ACTIVE };
        const result = await service.updateMemberByAdmin(input);
        expect(model.findOneAndUpdate).toHaveBeenCalledWith({ _id: memberId }, input, { new: true });
        expect(result.memberStatus).toBe(MemberStatus.ACTIVE);
    });

});
