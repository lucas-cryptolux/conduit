import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthMiddleware } from '../user/auth.middleware';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { RosterController } from './roster.controller';
import { RosterService } from './roster.service';

@Module({
  controllers: [RosterController],
  imports: [MikroOrmModule.forFeature({ entities: [User] }), UserModule],
  providers: [RosterService],
})
export class RosterModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'roster', method: RequestMethod.GET },
      );
  }
}

