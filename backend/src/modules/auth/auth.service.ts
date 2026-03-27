import { AuthRepository } from './auth.repo';
import { SignupDto ,LoginDto } from './auth.dtos';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';


export class AuthService {
    private authRepo = new AuthRepository();

    async signup(signupDto: SignupDto) {
        const { email, password, name } = signupDto;

        const existingUser = await this.authRepo.getUserByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.authRepo.createUser({
            email,
            password: hashedPassword,
            name,
        });

        return { message: 'User created successfully', user };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.authRepo.getUserByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '24h',
        });

        return { message: 'Login successful', token, user };
    }

    async validateUser(token: string) {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        const secret = process.env.JWT_SECRET || 'secret';

        let decoded: any;
        try {
            decoded = jwt.verify(token, secret);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }

        if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
            throw new Error('Invalid token payload');
        }

        const user = await this.authRepo.getUser(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }
}
