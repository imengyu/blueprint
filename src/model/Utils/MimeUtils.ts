export function getExtByMimeType(type: string): string {
  switch(type) {
    case 'application/json': return '.json';
  }
  return '';
}