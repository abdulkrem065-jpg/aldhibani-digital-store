import { CustomerRepository } from '../repositories/customer.repository';

export class CustomerService {
  public static async getCustomers() {
    return await CustomerRepository.getAll();
  }

  public static async saveCustomer(customer: any) {
    return await CustomerRepository.upsert(customer);
  }

  public static async deleteCustomer(id: string) {
    return await CustomerRepository.delete(id);
  }

  public static async resetCustomers() {
    return await CustomerRepository.clearAll();
  }
}
