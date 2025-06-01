import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');
const DAY_WIDTH = (width - 40) / 7;

type CustomCalendarProps = {
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
};

export default function CustomCalendar({
  onDateSelect,
  selectedDate,
  minDate = new Date(),
  maxDate,
}: CustomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(selectedDate);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() || 7; // Convert Sunday (0) to 7

    return {
      daysInMonth,
      startingDay,
      firstDay,
      lastDay,
    };
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    if (newDate >= minDate) {
      setCurrentDate(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    if (!maxDate || newDate <= maxDate) {
      setCurrentDate(newDate);
    }
  };

  const handleDayPress = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (newDate >= minDate && (!maxDate || newDate <= maxDate)) {
      setSelectedDay(newDate);
      onDateSelect(newDate);
    }
  };

  const { daysInMonth, startingDay, firstDay, lastDay } = getDaysInMonth(currentDate);
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const renderDays = () => {
    const days = [];
    const emptyDays = startingDay - 1;

    // Add empty days for the first week
    for (let i = 0; i < emptyDays; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDay?.toDateString() === date.toDateString();
      const isDisabled = date < minDate || (maxDate && date > maxDate);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelected && styles.selectedDay,
            isDisabled && styles.disabledDay,
          ]}
          onPress={() => handleDayPress(day)}
          disabled={isDisabled}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.selectedDayText,
              isDisabled && styles.disabledDayText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          disabled={new Date(currentDate.getFullYear(), currentDate.getMonth() - 1) < minDate}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={new Date(currentDate.getFullYear(), currentDate.getMonth() - 1) < minDate
              ? Colors.lightGray
              : Colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={handleNextMonth}
          disabled={maxDate && new Date(currentDate.getFullYear(), currentDate.getMonth() + 1) > maxDate}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={maxDate && new Date(currentDate.getFullYear(), currentDate.getMonth() + 1) > maxDate
              ? Colors.lightGray
              : Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {renderDays()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    width: DAY_WIDTH,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
    borderRadius: DAY_WIDTH / 2,
  },
  selectedDayText: {
    color: Colors.white,
    fontFamily: 'Montserrat-Bold',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: Colors.lightGray,
  },
}); 