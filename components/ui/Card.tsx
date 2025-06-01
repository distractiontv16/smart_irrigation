import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import Colors from '../../constants/Colors';

interface CardProps extends ViewProps {
  style?: ViewStyle;
  elevation?: number;
  variant?: 'default' | 'outlined' | 'transparent';
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  style,
  elevation = 2,
  variant = 'default',
  children,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'default' && [styles.defaultCard, { elevation }],
        variant === 'outlined' && styles.outlinedCard,
        variant === 'transparent' && styles.transparentCard,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  defaultCard: {
    backgroundColor: Colors.white,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  outlinedCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  transparentCard: {
    backgroundColor: Colors.cardBackground,
  },
});

export default Card;
