import type { ItemIconKey } from './item-types';

export const iconTags: Record<ItemIconKey, string[]> = {
  keys: ['key', 'llave', 'llaves', 'keys', 'auto', 'car', 'door', 'puerta'],
  wallet: ['wallet', 'billetera', 'cartera', 'money', 'dinero', 'plata'],
  phone: ['phone', 'telefono', 'celular', 'mobile', 'smartphone'],
  documents: ['documents', 'documentos', 'papeles', 'papers', 'id', 'dni', 'pasaporte'],
  umbrella: ['umbrella', 'paraguas', 'lluvia', 'rain', 'weather'],
  water: ['water', 'agua', 'bottle', 'botella', 'drink', 'beber'],
  meds: ['meds', 'pills', 'pastillas', 'medicamento', 'medicina', 'health', 'salud'],
  charger: ['charger', 'cargador', 'cable', 'battery', 'bateria', 'power'],
  backpack: ['backpack', 'mochila', 'bag', 'bolso', 'school', 'escuela'],
  laptop: ['laptop', 'notebook', 'computer', 'computadora', 'pc', 'work', 'trabajo'],
  headphones: ['headphones', 'auriculares', 'music', 'musica', 'audio', 'listen'],
  glasses: ['glasses', 'anteojos', 'lentes', 'gafas', 'eyes', 'ojos', 'vision'],
  book: ['book', 'libro', 'read', 'leer', 'study', 'estudiar'],
  'shopping-bag': ['shopping', 'compras', 'bolsa', 'bag', 'supermarket', 'supermercado'],
  coffee: ['coffee', 'cafe', 'tea', 'te', 'drink', 'morning', 'mañana'],
  watch: ['watch', 'reloj', 'time', 'tiempo', 'hora'],
  gift: ['gift', 'regalo', 'present', 'presente', 'surprise', 'sorpresa'],
  'credit-card': ['credit', 'card', 'tarjeta', 'credito', 'debito', 'pay', 'pagar'],
};

export function searchIcons(query: string, allKeys: readonly ItemIconKey[]): ItemIconKey[] {
  if (!query || query.trim() === '') return [...allKeys];

  const normalizedQuery = query.toLowerCase().trim();
  const searchTerms = normalizedQuery.split(' ').filter(Boolean);

  return allKeys.filter((key) => {
    const tags = iconTags[key] || [];
    // The key itself is a tag
    const allTags = [key, ...tags].map((t) => t.toLowerCase());

    // Check if ALL search terms match at least one tag partially
    return searchTerms.every((term) =>
      allTags.some((tag) => tag.includes(term)),
    );
  });
}
