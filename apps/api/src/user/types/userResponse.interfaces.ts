import { UserType } from '@app/user/types/user.types';

export interface UserResponseInterface {
  user: UserType & { token: string };
}
