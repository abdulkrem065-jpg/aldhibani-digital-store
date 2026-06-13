import { ProductRepository } from '../repositories/product.repository';

export class ProductService {
  public static async getProducts() {
    return await ProductRepository.getAll();
  }

  public static async saveProduct(product: any) {
    return await ProductRepository.upsert(product);
  }

  public static async deleteProduct(id: string) {
    return await ProductRepository.delete(id);
  }

  public static async resetProducts() {
    return await ProductRepository.clearAll();
  }
}
