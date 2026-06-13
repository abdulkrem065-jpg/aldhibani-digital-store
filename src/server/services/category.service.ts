import { CategoryRepository } from '../repositories/category.repository';

export class CategoryService {
  public static async getCategories() {
    return await CategoryRepository.getAll();
  }

  public static async saveCategory(category: any) {
    return await CategoryRepository.upsert(category);
  }

  public static async deleteCategory(id: string) {
    return await CategoryRepository.delete(id);
  }

  public static async resetCategories() {
    return await CategoryRepository.clearAll();
  }
}
