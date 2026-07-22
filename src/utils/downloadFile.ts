export async function downloadFile(url: string, filename: string, token: string, acceptType?: string) {
  try {
    const accept = acceptType || '*/*';
    const headers: Record<string, string> = {
      Accept: accept,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Export failed [${res.status}]:`, errorText);
      throw new Error(`Export failed: ${res.status} — ${errorText}`);
    }

    const contentType = res.headers.get('Content-Type') ?? '';
    if (
      !contentType.includes('spreadsheet') &&
      !contentType.includes('octet-stream') &&
      !contentType.includes('pdf') &&
      !contentType.includes('excel')
    ) {
      const body = await res.text();
      console.error('Unexpected content type:', contentType, body);
      throw new Error(`Server returned unexpected content type: ${contentType}`);
    }

    const blob = await res.blob();
    if (blob.size === 0) throw new Error('Export returned an empty file');

    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  } catch (err) {
    console.error('downloadFile error:', err);
    throw err;
  }
}
