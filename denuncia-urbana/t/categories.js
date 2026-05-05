export const CATEGORIES = [
  { id: 'buraco',     label: 'Buraco',         icon: 'warning-outline',             color: '#E24B4A' },
  { id: 'iluminacao', label: 'Iluminação',      icon: 'bulb-outline',                color: '#EF9F27' },
  { id: 'lixo',       label: 'Descarte Ilegal', icon: 'trash-outline',               color: '#639922' },
  { id: 'calcada',    label: 'Calçada',         icon: 'footsteps-outline',           color: '#378ADD' },
  { id: 'vandalismo', label: 'Vandalismo',      icon: 'construct-outline',           color: '#D4537E' },
  { id: 'outros',     label: 'Outros',          icon: 'ellipsis-horizontal-outline', color: '#888780' },
];

export const STATUS_OPTIONS = ['Aberto', 'Em análise', 'Resolvido'];

export const STATUS_COLORS = {
  'Aberto':     { bg: '#FCEBEB', text: '#A32D2D', dot: '#E24B4A' },
  'Em análise': { bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27' },
  'Resolvido':  { bg: '#EAF3DE', text: '#3B6D11', dot: '#639922' },
};

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
