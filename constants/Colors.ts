// Palette de couleurs principale selon la charte graphique du projet SmartIrrigation

const Colors = {
  // Couleurs principales
  primary: '#3A7D44', // Vert foncé - Couleur principale
  secondary: '#4ECDC4', // Vert clair - Éléments secondaires
  tertiary: '#FF6B6B', // Vert pastel - Arrière-plans
  
  // Couleurs secondaires
  blue: '#4A90E2', // Bleu - Éléments liés à l'eau et l'irrigation
  yellow: '#FFD93D', // Jaune - Alertes et notifications importantes
  earth: '#8B4513', // Terre - Éléments liés au sol
  
  // Couleurs neutres
  white: '#FFFFFF', // Blanc - Arrière-plan principal
  light: '#F5F5F5', // Blanc cassé - Fond clair pour les sections
  lightGray: '#E0E0E0', // Gris clair - Séparateurs et zones inactives
  darkGray: '#333333', // Gris foncé - Texte principal
  gray: '#666666',  // Ajout de la couleur gray
  text: '#212121', // Couleur standard pour le texte
  
  // Couleurs fonctionnelles
  danger: '#FF3B30', // Rouge - Erreurs et actions destructives
  warning: '#FFCC00', // Orange - Avertissements
  info: '#007AFF', // Bleu clair - Informations
  success: '#34C759', // Vert - Succès
  disabled: 'rgba(58, 125, 68, 0.5)', // Version transparente du primary pour les éléments désactivés

  // Couleurs avec transparence
  translucentGreen: 'rgba(76, 175, 80, 0.15)', // Vert translucide
  cardBackground: 'rgba(76, 175, 80, 0.08)', // Fond de carte
  darkOverlay: 'rgba(0, 0, 0, 0.5)', // Superposition sombre pour les images

  // Nouvelles clés
  background: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E0E0E0',
  notification: '#FF3B30',
  error: '#FF3B30',
};
export default Colors;

