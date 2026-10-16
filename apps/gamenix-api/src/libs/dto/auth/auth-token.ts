import { Types } from 'mongoose';
import { AuthTokenPurpose } from '../../enums/auth-token.enum';

// Internal persistence type, intentionally absent from the GraphQL schema.
export interface AuthToken {
    memberId: Types.ObjectId;
    purpose: AuthTokenPurpose;
    emailSnapshot: string;
    emailVersion: number;
    tokenHash: string;
    expiresAt: Date;
    consumedAt: Date | null;
}
