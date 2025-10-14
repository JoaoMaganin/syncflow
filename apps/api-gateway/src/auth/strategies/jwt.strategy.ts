import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // const secret = configService.get<string>('JWT_SECRET');

    // console.log('JWT Secret being used by API Gateway:', secret);

    super({
      // Diz à estratégia como encontrar o token na requisição
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Garante que tokens expirados sejam rejeitados
      ignoreExpiration: false,
      // Pega a chave secreta das variáveis de ambiente
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  // Este método é chamado APÓS o token ser validado com sucesso
  async validate(payload: any) {
    console.log('--- JWT VALIDATION SUCCESSFUL ---');
    console.log('Payload received:', payload);
    // O payload é o que definimos no auth-service: { sub: user.id, username: user.username }
    // O que for retornado aqui será injetado no objeto `request` do controller
    return { userId: payload.sub, username: payload.username };
  }
}