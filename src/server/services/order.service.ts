import { OrderRepository } from '../repositories/order.repository';

export class OrderService {
  public static async getOrders() {
    return await OrderRepository.getAll();
  }

  public static async saveOrder(order: any) {
    return await OrderRepository.upsert(order);
  }

  public static async resetOrders() {
    return await OrderRepository.clearAll();
  }
}
