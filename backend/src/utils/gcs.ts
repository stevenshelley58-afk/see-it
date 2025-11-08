export function parseGcsUrl(url: string) {
  if (url.startsWith('gs://')) {
    const [, bucket, ...rest] = url.split('/');
    return { bucket, object: rest.join('/') };
  }

  const match = url.match(/https?:\/\/storage.googleapis.com\/([^/]+)\/(.+)/);
  if (match) {
    return { bucket: match[1], object: match[2] };
  }

  throw new Error(`Unsupported GCS URL: ${url}`);
}

