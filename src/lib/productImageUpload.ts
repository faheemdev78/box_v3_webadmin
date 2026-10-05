import axios from 'axios';
import { getSessionToken } from '@/lib/auth';

export async function uploadProductImages({
  files, productId, target, create_thumb = true,
}: {
  files: File[]; productId: string; target: 'picture' | 'gallery'; create_thumb?: boolean;
}) {
  if (!files.length) return { error: { message: 'No images to upload.' } };
  // Use the same backend host as Apollo; ADMIN_API_URI points at the Next.js app.
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URI;
  if (!graphqlUrl) return { error: { message: 'Backend GraphQL URL is not configured.' } };
  const endpoint = new URL(graphqlUrl);
  endpoint.pathname = endpoint.pathname.replace(/\/graphql\/?$/, '') +
    `/api/products/${encodeURIComponent(productId)}/images/${target}`;
  endpoint.search = '';
  endpoint.hash = '';
  const form = new FormData();
  form.append('create_thumb', String(create_thumb));
  files.forEach(file => form.append('files', file));
  try {
    const { data } = await axios.post(endpoint.toString(), form, {
      headers: { Authorization: `Bearer ${getSessionToken()}` },
      withCredentials: true,
      timeout: 240000,
    });
    return data;
  } catch (error: any) {
    return { error: { message: error.response?.data?.error?.message || error.message || 'Image upload failed.' } };
  }
}

export async function uploadProductVideo({ file, productId }: { file: File; productId: string }) {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URI;
  if (!graphqlUrl) return { error: { message: 'Backend GraphQL URL is not configured.' } };
  const endpoint = new URL(graphqlUrl);
  endpoint.pathname = endpoint.pathname.replace(/\/graphql\/?$/, '') +
    `/api/products/${encodeURIComponent(productId)}/video`;
  endpoint.search = '';
  endpoint.hash = '';
  const form = new FormData();
  form.append('files', file);
  try {
    const { data } = await axios.post(endpoint.toString(), form, {
      headers: { Authorization: `Bearer ${getSessionToken()}` },
      withCredentials: true,
      timeout: 240000,
    });
    return data;
  } catch (error: any) {
    return { error: { message: error.response?.data?.error?.message || error.message || 'Video upload failed.' } };
  }
}
