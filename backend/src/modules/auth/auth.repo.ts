import {prisma} from '../../common/config/prisma';
import { SignupDto , LoginDto} from './auth.dtos';

export class AuthRepository {

    async createUser({email, password, name}: SignupDto) {
        return await prisma.user.create({
            data: {
                email,
                passwordHash: password,
                name,
            },
        });
    }

    async getUser(id: string) {
        return await prisma.user.findUnique({
            where: { id },
        });
    }

    async getUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
        });
    }

    async updateUser(id: string, data: { email?: string; name?: string }) {
        return await prisma.user.update({
            where: { id },
            data,
        });
    }

    async deleteUser(id: string) {
        return await prisma.user.delete({
            where: { id },
        });
    }
}