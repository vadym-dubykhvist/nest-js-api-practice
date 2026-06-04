import { ProfileType } from '@app/profile/types/profile.types';

export interface ProfileResponseInterface {
  profile: Pick<ProfileType, 'username' | 'bio' | 'image' | 'following'>;
}
