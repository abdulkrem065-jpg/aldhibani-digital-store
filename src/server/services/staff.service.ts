import { StaffRepository } from '../repositories/staff.repository';

export class StaffService {
  public static async authenticate(username: string, passwordPlain: string) {
    const user = await StaffRepository.getByUsername(username);
    if (!user) return null;

    const storedSecret = user.password_hash || user.password;
    if (storedSecret === passwordPlain) {
      return user;
    }
    return null;
  }

  public static async savePermissions(id: string, permissions: any) {
    return await StaffRepository.updatePermissions(id, permissions);
  }

  public static async savePassword(id: string, passwordPlain: string) {
    return await StaffRepository.updatePasswordPlain(id, passwordPlain);
  }
}
