import { Platform } from 'react-native';

/**
 * Helper function to create shadow styles that work on both web and mobile
 * @param {Object} options - Shadow options
 * @param {string} options.color - Shadow color (default: '#000')
 * @param {number} options.offsetX - Horizontal offset (default: 0)
 * @param {number} options.offsetY - Vertical offset (default: 2)
 * @param {number} options.opacity - Shadow opacity (default: 0.1)
 * @param {number} options.radius - Shadow blur radius (default: 4)
 * @returns {Object} Style object with appropriate shadow properties
 */
export const createShadow = ({
  color = '#000',
  offsetX = 0,
  offsetY = 2,
  opacity = 0.1,
  radius = 4,
} = {}) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(${hexToRgb(color)}, ${opacity})`,
    };
  }
  
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: Math.max(radius / 2, 2), // Android elevation
  };
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}
