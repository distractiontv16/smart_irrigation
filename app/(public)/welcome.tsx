import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Image, Dimensions, TouchableOpacity, FlatList, Animated } from 'react-native';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

// Données du carrousel
const carouselData = [
  {
    id: '1',
    title: 'Bienvenue sur SmartIrrigation',
    description: 'L\'application intelligente pour optimiser l\'irrigation de vos cultures',
    image: require('../../assets/images/welcome1.jpg'),
  },
  {
    id: '2',
    title: 'Irrigation Intelligente',
    description: 'Optimisez vos ressources en eau grâce à nos conseils personnalisés',
    image: require('../../assets/images/welcome2.jpg'),
  },
  {
    id: '3',
    title: 'IA au service de l\'agriculture',
    description: 'Des recommandations précises basées sur le type de sol et la météo',
    image: require('../../assets/images/welcome3.jpg'),
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Défilement automatique du carrousel
  useEffect(() => {
    const timer = setInterval(() => {
      if (flatListRef.current) {
        if (activeIndex < carouselData.length - 1) {
          flatListRef.current.scrollToIndex({
            index: activeIndex + 1,
            animated: true,
          });
        } else {
          flatListRef.current.scrollToIndex({
            index: 0,
            animated: true,
          });
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const renderItem = ({ item }: { item: typeof carouselData[0] }) => (
    <View style={styles.slide}>
      <Image 
        source={item.image} 
        style={styles.image} 
        resizeMode="cover" 
      />
      <View style={styles.overlay}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </View>
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={carouselData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={(info) => {
          if (info.viewableItems.length > 0 && info.viewableItems[0].index !== null) {
            setActiveIndex(info.viewableItems[0].index);
          }
        }}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      />
      
      {/* Indicateurs de position */}
      <View style={styles.indicatorContainer}>
        {carouselData.map((item, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={`indicator-${item.id}`}
              style={[styles.indicator, { opacity }]}
            />
          );
        })}
      </View>
      
      {/* Bouton de démarrage */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(public)/login' as any)}
      >
        <Text style={styles.buttonText}>Commencer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    width,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  textContainer: {
    padding: 20,
    paddingBottom: 150,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
  button: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 