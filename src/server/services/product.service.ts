import { ProductRepository } from '../repositories/product.repository';

export class ProductService {
  public static async getProducts() {
    return await ProductRepository.getAll();
  }
}
