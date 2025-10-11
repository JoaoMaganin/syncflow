import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { Module } from "@nestjs/common";
import { User } from "./entities/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [AuthController],
})
export class AuthModule {}