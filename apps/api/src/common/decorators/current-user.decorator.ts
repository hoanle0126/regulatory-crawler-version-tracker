import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface IAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): IAuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
