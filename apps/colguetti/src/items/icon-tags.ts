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
  moon: ['moon', 'luna', 'night', 'noche', 'sleep', 'dormir'],
  arrow: ['arrow', 'flecha', 'direction', 'direccion', 'next', 'siguiente'],
  sun: ['sun', 'sol', 'day', 'dia', 'morning', 'mañana'],
  cross: ['cross', 'cruz', 'cancel', 'cancelar', 'close', 'cerrar'],
  tick: ['tick', 'check', 'done', 'listo', 'ok', 'bien'],
  heart: ['heart', 'corazon', 'love', 'amor', 'health', 'salud'],
  undo: ['undo', 'deshacer', 'back', 'atras', 'return', 'volver'],
  redo: ['redo', 'rehacer', 'forward', 'adelante'],
  refresh: ['refresh', 'actualizar', 'reload', 'recargar'],
  trophy: ['trophy', 'trofeo', 'win', 'ganar', 'prize', 'premio'],
  play: ['play', 'jugar', 'start', 'empezar', 'video', 'music'],
  gear: ['gear', 'engranaje', 'settings', 'configuracion', 'ajustes'],
  zap: ['zap', 'rayo', 'energy', 'energia', 'fast', 'rapido', 'power'],
  leaf: ['leaf', 'hoja', 'nature', 'naturaleza', 'plant', 'planta'],
  alert: ['alert', 'alerta', 'warning', 'peligro', 'attention', 'atencion'],
  'circle-check': ['check', 'listo', 'ok', 'circle', 'circulo', 'done'],
  'circle-x': ['cross', 'cruz', 'cancel', 'cancelar', 'close', 'cerrar', 'circle'],
  plug: ['plug', 'enchufe', 'power', 'energia', 'electric'],
  eye: ['eye', 'ojo', 'vision', 'see', 'ver'],
  'eye-off': ['eye', 'ojo', 'hide', 'ocultar', 'blind', 'ciego'],
  search: ['search', 'buscar', 'find', 'encontrar', 'lupa'],
  trash: ['trash', 'basura', 'delete', 'borrar', 'remove', 'quitar'],
};

export function searchIcons(query: string, allKeys: readonly ItemIconKey[]): ItemIconKey[] {
  if (!query || query.trim() === '') return [...allKeys];
  
  const normalizedQuery = query.toLowerCase().trim();
  const searchTerms = normalizedQuery.split(' ').filter(Boolean);

  return allKeys.filter((key) => {
    const tags = iconTags[key] || [];
    // The key itself is a tag
    const allTags = [key, ...tags].map(t => t.toLowerCase());
    
    // Check if ALL search terms match at least one tag partially
    return searchTerms.every(term => 
      allTags.some(tag => tag.includes(term))
    );
  });
}
