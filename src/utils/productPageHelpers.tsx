import type Product from '../interfaces/Product';

export interface SortOption {
  description: string;
  key: keyof Product;
  order: number;
}

export function getHelpers(products: Product[]) {
  const categories = [
    'All (' + products.length + ')',
    ...products
      .map(product => product.categories)
      .flat()
      .map((category, _index, array) => category + ' ('
        + array.filter(candidate => category === candidate).length + ')')
      .filter((category, index, array) => array.indexOf(category) === index)
      .sort()
  ];

  const sortOptions: SortOption[] = [
    { description: 'Price (low to high)', key: 'price$', order: 1 },
    { description: 'Price (high to low)', key: 'price$', order: -1 },
    { description: 'Product name (a-z)', key: 'name', order: 1 },
    { description: 'Product name (z-a)', key: 'name', order: -1 }
  ];

  const sortDescriptions = sortOptions.map(option => option.description);

  return {
    products,
    categories,
    sortOptions,
    sortDescriptions
  };
}
