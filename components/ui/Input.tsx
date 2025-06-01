import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: string;
  leftIcon?: string;
  onRightIconPress?: () => void;
  onLeftIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  secure?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  rightIcon,
  leftIcon,
  onRightIconPress,
  onLeftIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  secure = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secure);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.focusedInput,
        error && styles.errorInput,
      ]}>
        {leftIcon && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onLeftIconPress}
            disabled={!onLeftIconPress}
          >
            <Ionicons name={leftIcon as any} size={20} color={Colors.darkGray} />
          </TouchableOpacity>
        )}
        
        <TextInput
          style={[
            styles.input,
            inputStyle,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secure) && styles.inputWithRightIcon,
            leftIcon && (rightIcon || secure) && styles.inputWithBothIcons,
          ]}
          placeholderTextColor={Colors.darkGray}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secure && !showPassword}
          {...rest}
        />
        
        {secure && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={togglePasswordVisibility}
          >
            <Ionicons 
              name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={Colors.darkGray} 
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secure && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon as any} size={20} color={Colors.darkGray} />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  focusedInput: {
    borderColor: Colors.primary,
  },
  errorInput: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  inputWithBothIcons: {
    paddingHorizontal: 8,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'OpenSans-Regular',
  },
});

export default Input;
