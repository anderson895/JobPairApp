export async function uploadToCloudinary(uri: string): Promise<string> {
  try {
    const data = new FormData();
    data.append('file', {
      uri,
      name: 'upload.jpg',
      type: 'image/jpeg',
    } as any);
    data.append('upload_preset', 'jobpair');
    data.append('cloud_name', 'dmqbyalbb');

    const res = await fetch('https://api.cloudinary.com/v1_1/dmqbyalbb/image/upload', {
      method: 'POST',
      body: data,
    });

    const json = await res.json();
    console.log('Cloudinary response:', json);

    if (!json.secure_url) {
      throw new Error(json.error?.message || 'Upload failed: No secure_url returned');
    }

    return json.secure_url;

  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error; // so the caller can handle it too
  }
}
