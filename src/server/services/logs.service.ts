import { LogsRepository } from '../repositories/logs.repository';

export class LogsService {
  public static async log(action: string, operator: string, payload: any) {
    return await LogsRepository.insertAuditLog(action, operator, payload);
  }
}
