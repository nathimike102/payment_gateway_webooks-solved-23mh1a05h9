export function generateId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = prefix;
  
  for (let i = 0; i < 16; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

export async function generateUniqueId(
  prefix: string,
  checkExists: (id: string) => Promise<boolean>
): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const id = generateId(prefix);
    const exists = await checkExists(id);
    
    if (!exists) {
      return id;
    }
    
    attempts++;
  }
  
  throw new Error(`Failed to generate unique ID after ${maxAttempts} attempts`);
}
