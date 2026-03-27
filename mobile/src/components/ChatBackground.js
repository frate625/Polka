// Фоновый узор для чата
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../store/ThemeContext';

export default function ChatBackground() {
  const { theme } = useTheme();
  
  if (Platform.OS !== 'web') {
    return null; // Для мобильных пока не добавляем
  }

  const isDark = theme.name === 'dark';
  const patternColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(245,235,220,0.3)';
  
  return (
    <View style={styles.container} pointerEvents="none">
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <defs>
          <pattern id="chat-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            {/* Звездочки */}
            <path 
              d="M20,20 L22,22 L20,24 L18,22 Z" 
              fill={patternColor}
              opacity="0.5"
            />
            <path 
              d="M70,30 L72,32 L70,34 L68,32 Z" 
              fill={patternColor}
              opacity="0.4"
            />
            <path 
              d="M40,60 L42,62 L40,64 L38,62 Z" 
              fill={patternColor}
              opacity="0.6"
            />
            
            {/* Круги */}
            <circle cx="50" cy="20" r="2" fill={patternColor} opacity="0.3" />
            <circle cx="80" cy="70" r="3" fill={patternColor} opacity="0.2" />
            <circle cx="15" cy="50" r="2.5" fill={patternColor} opacity="0.4" />
            
            {/* Сердечки */}
            <path 
              d="M60,70 Q60,65 65,65 Q70,65 70,70 Q70,75 60,80 Q50,75 50,70 Q50,65 55,65 Q60,65 60,70" 
              fill={patternColor}
              opacity="0.25"
            />
            
            {/* Молнии */}
            <path 
              d="M30,40 L28,45 L31,45 L29,50 L35,43 L32,43 L34,40 Z" 
              fill={patternColor}
              opacity="0.3"
            />
            
            {/* Облака */}
            <ellipse cx="85" cy="50" rx="6" ry="4" fill={patternColor} opacity="0.2" />
            <ellipse cx="82" cy="50" rx="4" ry="3" fill={patternColor} opacity="0.2" />
            <ellipse cx="88" cy="50" rx="4" ry="3" fill={patternColor} opacity="0.2" />
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
