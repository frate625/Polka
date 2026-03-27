// Фоновый узор для чата
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../store/ThemeContext';

export default function ChatBackground({ chatTheme, customColors }) {
  const { theme } = useTheme();
  
  if (Platform.OS !== 'web') {
    return null; // Для мобильных пока не добавляем
  }

  const isDark = theme.mode === 'dark';
  const patternColor = customColors?.pattern || (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(210,180,140,0.15)');
  
  return (
    <View style={styles.container} pointerEvents="none">
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <defs>
          <pattern id="chat-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            {/* Звездочки - больше и хаотичнее */}
            <path d="M12,8 L13.5,9.5 L12,11 L10.5,9.5 Z" fill={patternColor} opacity="0.7" />
            <path d="M45,15 L47,17 L45,19 L43,17 Z" fill={patternColor} opacity="0.5" />
            <path d="M25,35 L26.5,36.5 L25,38 L23.5,36.5 Z" fill={patternColor} opacity="0.8" />
            <path d="M52,48 L54,50 L52,52 L50,50 Z" fill={patternColor} opacity="0.6" />
            <path d="M8,52 L9.5,53.5 L8,55 L6.5,53.5 Z" fill={patternColor} opacity="0.5" />
            <path d="M38,4 L39.5,5.5 L38,7 L36.5,5.5 Z" fill={patternColor} opacity="0.6" />
            
            {/* Круги - много разных размеров */}
            <circle cx="30" cy="12" r="1.5" fill={patternColor} opacity="0.4" />
            <circle cx="18" cy="25" r="2" fill={patternColor} opacity="0.5" />
            <circle cx="48" cy="32" r="1.8" fill={patternColor} opacity="0.3" />
            <circle cx="5" cy="40" r="2.2" fill={patternColor} opacity="0.6" />
            <circle cx="55" cy="8" r="1.6" fill={patternColor} opacity="0.4" />
            <circle cx="35" cy="55" r="1.9" fill={patternColor} opacity="0.5" />
            <circle cx="15" cy="5" r="1.4" fill={patternColor} opacity="0.4" />
            
            {/* Сердечки */}
            <path d="M40,25 Q40,22 42.5,22 Q45,22 45,25 Q45,28 40,31 Q35,28 35,25 Q35,22 37.5,22 Q40,22 40,25" fill={patternColor} opacity="0.4" />
            <path d="M20,48 Q20,46 22,46 Q24,46 24,48 Q24,50 20,52 Q16,50 16,48 Q16,46 18,46 Q20,46 20,48" fill={patternColor} opacity="0.5" />
            
            {/* Молнии */}
            <path d="M8,20 L6,24 L8.5,24 L7,28 L11,22 L8.5,22 L10,20 Z" fill={patternColor} opacity="0.5" />
            <path d="M50,40 L48,44 L50.5,44 L49,48 L53,42 L50.5,42 L52,40 Z" fill={patternColor} opacity="0.6" />
            
            {/* Облака */}
            <ellipse cx="28" cy="45" rx="4" ry="2.5" fill={patternColor} opacity="0.3" />
            <ellipse cx="26" cy="45" rx="3" ry="2" fill={patternColor} opacity="0.3" />
            <ellipse cx="30" cy="45" rx="3" ry="2" fill={patternColor} opacity="0.3" />
            
            {/* Музыкальные ноты */}
            <circle cx="42" cy="10" r="1.2" fill={patternColor} opacity="0.5" />
            <path d="M42,10 L42,5 Q45,4 45,6 L45,11" stroke={patternColor} strokeWidth="0.8" fill="none" opacity="0.5" />
            <circle cx="45" cy="11" r="1.2" fill={patternColor} opacity="0.5" />
            
            {/* Колокольчики */}
            <path d="M14,32 Q14,30 16,30 Q18,30 18,32 L18,35 Q16,36 14,35 L14,32" fill={patternColor} opacity="0.4" />
            <circle cx="16" cy="36" r="0.5" fill={patternColor} opacity="0.4" />
            
            {/* Смайлики */}
            <circle cx="55" cy="25" r="3" stroke={patternColor} strokeWidth="0.6" fill="none" opacity="0.5" />
            <circle cx="53.5" cy="24" r="0.4" fill={patternColor} opacity="0.5" />
            <circle cx="56.5" cy="24" r="0.4" fill={patternColor} opacity="0.5" />
            <path d="M53,26 Q55,27 57,26" stroke={patternColor} strokeWidth="0.5" fill="none" opacity="0.5" />
            
            {/* Камеры */}
            <rect x="3" y="10" width="6" height="4" rx="1" fill={patternColor} opacity="0.4" />
            <circle cx="6" cy="12" r="1.2" fill={patternColor} opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chat-pattern)" />
      </svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0
  }
});
