import type { LoaderFunctionArgs } from 'react-router-dom';

export default async function productsLoader({ params }: LoaderFunctionArgs) {
  let url = '/api/products';
  if (params.slug) {
    url += '?slug=' + params.slug;
  }

  const response = await fetch(url);
  return {
    products: await response.json(),
  };
}
