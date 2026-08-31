import { Category } from '../stores/categoryStore';

export function getCategoryNameFrequencies(categories: Category[]): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const category of categories) {
    const name = category.name.toLowerCase();
    frequencies.set(name, (frequencies.get(name) || 0) + 1);
  }

  return frequencies;
}

export function formatCategoryName(
  category: Category,
  frequencies: Map<string, number>
): string {
  const count = frequencies.get(category.name.toLowerCase()) || 1;

  if (count > 1 && category.menu?.name) {
    return `${category.name} (${category.menu.name})`;
  }

  return category.name;
}

export function getActiveCategories(categories: Category[]): Category[] {
  return categories.filter(c => c.active);
}

export function getSortedCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name));
}

interface ProductCategory {
  name: string;
  active: boolean;
  menu?: {
    name: string;
  };
}

export function getProductCategoryNameFrequencies(
  categories: (ProductCategory | undefined)[]
): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const category of categories) {
    if (!category?.name) continue;
    const name = category.name.toLowerCase();
    frequencies.set(name, (frequencies.get(name) || 0) + 1);
  }

  return frequencies;
}

export function formatProductCategoryName(
  category: ProductCategory | undefined,
  frequencies: Map<string, number>
): string {
  if (!category?.name) return '-';

  const count = frequencies.get(category.name.toLowerCase()) || 1;

  if (count > 1 && category.menu?.name) {
    return `${category.name} (${category.menu.name})`;
  }

  return category.name;
}
