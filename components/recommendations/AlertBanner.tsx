import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

interface AlertBannerProps {
  message: string;
  type?: 'warning' | 'info' | 'danger';
  style?: ViewStyle;
}

/**
 * Bannière d'alerte
 * Affiche des alertes et contraintes liées à la météo
 */
const AlertBanner: React.FC<AlertBannerProps> = ({
  message,
  type = 'warning',
  style,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <Ionicons name="warning" size={24} color={Colors.yellow} />;
      case 'info':
        return <Ionicons name="information-circle" size={24} color={Colors.info} />;
      case 'danger':
        return <Ionicons name="alert-circle" size={24} color={Colors.danger} />;
      default:
        return <Ionicons name="warning" size={24} color={Colors.yellow} />;
    }
  };

  const getBannerStyle = () => {
    switch (type) {
      case 'warning':
        return styles.warningBanner;
      case 'info':
        return styles.infoBanner;
      case 'danger':
        return styles.dangerBanner;
      default:
        return styles.warningBanner;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'warning':
        return styles.warningText;
      case 'info':
        return styles.infoText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.warningText;
    }
  };

  return (
    <View style={[styles.container, getBannerStyle(), style]}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <Text style={[styles.text, getTextStyle()]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    lineHeight: 20,
  },
  warningBanner: {
    backgroundColor: 'rgba(245, 199, 49, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.yellow,
  },
  infoBanner: {
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  dangerBanner: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  warningText: {
    color: '#7A6518',
  },
  infoText: {
    color: '#0D47A1',
  },
  dangerText: {
    color: '#B71C1C',
  },
});

export default AlertBanner;
