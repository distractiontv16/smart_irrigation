import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import {
  LineChart,
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'react-native-chart-kit';
import Colors from '../../constants/Colors';

interface IrrigationForecastData {
  date: string;
  tomato?: number;
  lettuce?: number;
  corn?: number;
}

interface IrrigationForecastChartProps {
  data: IrrigationForecastData[];
  selectedCulture: 'Tomate' | 'Laitue' | 'Maïs';
  style?: any;
}

const CULTURE_COLORS = {
  Tomate: '#FF6347', // Rouge-orangé
  Laitue: '#90EE90', // Vert clair
  Maïs: '#FFD700',   // Jaune doré
};

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const IrrigationForecastChart: React.FC<IrrigationForecastChartProps> = ({
  data,
  selectedCulture,
  style,
}) => {
  // Convertir les données pour le graphique
  const chartData = {
    labels: DAYS_FR,
    datasets: [
      {
        data: data.map(d => {
          switch (selectedCulture) {
            case 'Tomate':
              return d.tomato || 0;
            case 'Laitue':
              return d.lettuce || 0;
            case 'Maïs':
              return d.corn || 0;
            default:
              return 0;
          }
        }),
        color: (opacity = 1) => CULTURE_COLORS[selectedCulture],
        strokeWidth: 3,
      },
    ],
  };

  // Configuration du graphique
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'white',
    backgroundGradientTo: 'white',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#FFF',
    },
    propsForBackgroundLines: {
      strokeDasharray: '3 3',
      stroke: '#E3E3E3',
    },
    propsForLabels: {
      fontFamily: 'RobotoMono-Medium',
      fontSize: 12,
    },
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>
        Prévisions d'irrigation sur 7 jours - {selectedCulture}
      </Text>
      
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 48} // -48 pour les marges
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={true}
        withDots={true}
        withShadow={false}
        segments={4}
        formatYLabel={(value) => `${value} L/m²`}
        renderDotContent={({ x, y, index }) => (
          <View
            key={index}
            style={[
              styles.dotLabel,
              {
                left: x - 20,
                top: y - 25,
              },
            ]}
          >
            <Text style={styles.dotValue}>
              {chartData.datasets[0].data[index].toFixed(1)}
            </Text>
          </View>
        )}
      />

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: CULTURE_COLORS[selectedCulture] },
            ]}
          />
          <Text style={styles.legendText}>{selectedCulture} (L/m²)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontFamily: 'RobotoMono-Bold',
    fontSize: 14,
    color: '#1A472A',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  dotLabel: {
    position: 'absolute',
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  dotValue: {
    fontFamily: 'RobotoMono-Medium',
    fontSize: 10,
    color: '#333',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontFamily: 'RobotoMono-Medium',
    fontSize: 12,
    color: '#666',
  },
});

export default IrrigationForecastChart; 