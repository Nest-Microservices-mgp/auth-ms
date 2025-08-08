import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from 'generated/prisma';

import { LoginUserDto, RegisterUserDto } from './dto';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  async onModuleInit() {
    await this.$connect();
    this.logger.log('MongoDB connected');
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;
    try {
      const user = await this.user.findUnique({
        where: { email: email },
      });
      if (user) {
        throw new RpcException({ status: 400, message: 'User already exists' });
      }
      const newUser = await this.user.create({
        data: {
          email,
          name,
          password: bcrypt.hashSync(password, 10),
        },
      });
      const { password: __, ...rest } = newUser;
      return { user: rest, token: 'ABC' };
    } catch (error) {
      throw new RpcException({ status: 400, message: error.message });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    try {
      const user = await this.user.findUnique({
        where: { email: email },
      });
      if (!user) {
        throw new RpcException({
          status: 400,
          message: 'User/Password not valid',
        });
      }
      const isValidPassword = bcrypt.compareSync(password, user.password);
      if (!isValidPassword) {
        throw new RpcException({
          status: 400,
          message: 'User/Password not valid',
        });
      }
      const { password: __, ...rest } = user;
      return { user: rest, token: 'ABC' };
    } catch (error) {
      throw new RpcException({ status: 400, message: error.message });
    }
  }
}
