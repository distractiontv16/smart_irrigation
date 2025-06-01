import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, TextInput, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import IrrigationCard from '../recommendations/IrrigationCard';
import { genererRecommandation, CultureData, SolData, WeatherData, Recommandation } from '@/services/recommendations.service';

/**
 * Composant de test pour simuler différents scénarios de recommandation
 * à utiliser pendant le développement et les tests
 */
const RecommendationsTester: React.FC = () => {
  // État local pour les entrées
  const [culture, setCulture] = useState<string>('tomate');
  const [datePlantation, setDatePlantation] = useState<Date>(new Date('2024-04-01'));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [sol, setSol] = useState<string>('ferrugineux');
  const [capaciteRetenue, setCapaciteRetenue] = useState<number>(60);
  const [intervalleIrrigation, setIntervalleIrrigation] = useState<number>(1);
  const [superficie, setSuperficie] = useState<number>(100);
  const [tMax, setTMax] = useState<number>(32);
  const [tMin, setTMin] = useState<number>(26);
  const [rayonnement, setRayonnement] = useState<number>(20);
  const [humidite, setHumidite] = useState<number>(65);
  const [pluie, setPluie] = useState<boolean>(false);
  const [pluiePrevue, setPluiePrevue] = useState<boolean>(false);
  const [heure, setHeure] = useState<number>(8);
  
  // État pour la recommandation générée
  const [recommendation, setRecommendation] = useState<Recommandation | null>(null);
  
  // Fonction pour générer la recommandation
  const genererTest = () => {
    const cultureData: CultureData = {
      nom: culture,
      datePlantation: datePlantation.toISOString().split('T')[0]
    };
    
    const solData: SolData = {
      nom: sol,
      capaciteRetenue: capaciteRetenue,
      intervalleIrrigation: intervalleIrrigation
    };
    
    const weatherData: WeatherData = {
      tMax,
      tMin,
      rayonnement,
      humidite,
      pluie,
      pluiePrevue,
      heure
    };
    
    const result = genererRecommandation(cultureData, solData, weatherData, superficie);
    setRecommendation(result);
  };
  
  // Fonction pour configurer les scénarios prédéfinis
  const setScenario = (scenario: string) => {
    switch (scenario) {
      case 'pluie':
        setPluie(true);
        setPluiePrevue(true);
        setHumidite(85);
        break;
      case 'chaleur':
        setTMax(39);
        setTMin(28);
        setHumidite(40);
        setPluie(false);
        setPluiePrevue(false);
        break;
      case 'humide':
        setHumidite(90);
        setPluie(false);
        break;
      case 'normal':
        setTMax(32);
        setTMin(26);
        setRayonnement(20);
        setHumidite(65);
        setPluie(false);
        setPluiePrevue(false);
        break;
    }
  };
  
  // Fonction pour configurer les stades de croissance
  const setStage = (stage: string) => {
    const today = new Date();
    let plantingDate = new Date();
    
    switch (stage) {
      case 'initial':
        // 10 jours avant aujourd'hui
        plantingDate = new Date(today.getTime() - (10 * 24 * 60 * 60 * 1000));
        break;
      case 'developpement':
        // 30 jours avant aujourd'hui
        plantingDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case 'floraison':
        // 60 jours avant aujourd'hui
        plantingDate = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000));
        break;
      case 'fin':
        // 90 jours avant aujourd'hui
        plantingDate = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
    }
    
    setDatePlantation(plantingDate);
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Testeur de Recommandations</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scénarios</Text>
        <View style={styles.buttonRow}>
          <Button title="Normal" onPress={() => setScenario('normal')} />
          <Button title="Pluie" onPress={() => setScenario('pluie')} />
          <Button title="Chaleur" onPress={() => setScenario('chaleur')} />
          <Button title="Humide" onPress={() => setScenario('humide')} />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stades de croissance</Text>
        <View style={styles.buttonRow}>
          <Button title="Initial" onPress={() => setStage('initial')} />
          <Button title="Développement" onPress={() => setStage('developpement')} />
          <Button title="Floraison" onPress={() => setStage('floraison')} />
          <Button title="Fin" onPress={() => setStage('fin')} />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres de culture</Text>
        
        <Text style={styles.label}>Culture:</Text>
        <Picker
          selectedValue={culture}
          onValueChange={(value) => setCulture(value)}
          style={styles.picker}
        >
          <Picker.Item label="Tomate" value="tomate" />
          <Picker.Item label="Maïs" value="mais" />
          <Picker.Item label="Laitue" value="laitue" />
          <Picker.Item label="Oignon" value="oignon" />
          <Picker.Item label="Piment" value="piment" />
          <Picker.Item label="Aubergine" value="aubergine" />
          <Picker.Item label="Carotte" value="carotte" />
          <Picker.Item label="Haricot" value="haricot" />
        </Picker>
        
        <Text style={styles.label}>Date de plantation: {datePlantation.toLocaleDateString()}</Text>
        <Button 
          title="Changer la date" 
          onPress={() => setShowDatePicker(true)} 
        />
        
        {showDatePicker && (
          <DateTimePicker
            value={datePlantation}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setDatePlantation(date);
            }}
          />
        )}
        
        <Text style={styles.label}>Sol:</Text>
        <Picker
          selectedValue={sol}
          onValueChange={(value) => setSol(value)}
          style={styles.picker}
        >
          <Picker.Item label="Ferrugineux" value="ferrugineux" />
          <Picker.Item label="Alluvial" value="alluvial" />
          <Picker.Item label="Argileux" value="argileux" />
          <Picker.Item label="Sablonneux" value="sablonneux" />
        </Picker>
        
        <Text style={styles.label}>Capacité retenue (mm/m):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={capaciteRetenue.toString()}
          onChangeText={(text) => setCapaciteRetenue(Number(text))}
        />
        
        <Text style={styles.label}>Intervalle irrigation (jours):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={intervalleIrrigation.toString()}
          onChangeText={(text) => setIntervalleIrrigation(Number(text))}
        />
        
        <Text style={styles.label}>Superficie (m²):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={superficie.toString()}
          onChangeText={(text) => setSuperficie(Number(text))}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres météo</Text>
        
        <Text style={styles.label}>Température max (°C):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={tMax.toString()}
          onChangeText={(text) => setTMax(Number(text))}
        />
        
        <Text style={styles.label}>Température min (°C):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={tMin.toString()}
          onChangeText={(text) => setTMin(Number(text))}
        />
        
        <Text style={styles.label}>Rayonnement (MJ/m²/jour):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={rayonnement.toString()}
          onChangeText={(text) => setRayonnement(Number(text))}
        />
        
        <Text style={styles.label}>Humidité (%):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={humidite.toString()}
          onChangeText={(text) => setHumidite(Number(text))}
        />
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Pluie actuelle:</Text>
          <Switch value={pluie} onValueChange={setPluie} />
        </View>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Pluie prévue:</Text>
          <Switch value={pluiePrevue} onValueChange={setPluiePrevue} />
        </View>
        
        <Text style={styles.label}>Heure (0-23):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={heure.toString()}
          onChangeText={(text) => setHeure(Number(text))}
        />
      </View>
      
      <Button
        title="Générer la recommandation"
        onPress={genererTest}
        color="#3A7D44"
      />
      
      {recommendation && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Résultat</Text>
          <IrrigationCard
            culture={recommendation.culture}
            sol={recommendation.sol}
            volume={recommendation.volume}
            totalVolume={recommendation.total}
            frequency={recommendation.frequence}
            moment={recommendation.moment}
            message={recommendation.message}
            constraint={recommendation.contrainte}
            weatherIcon={pluie ? "rainy" : pluiePrevue ? "cloudy" : humidite > 80 ? "partly-sunny" : "sunny"}
            plageHoraire={recommendation.plageHoraire}
            onMarkComplete={() => alert('Test: Irrigation marquée comme complétée')}
          />
          
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Détails techniques :</Text>
            <Text>Stade: {recommendation.stade}</Text>
            <Text>Coefficient Kc: {recommendation.kc}</Text>
            <Text>ET₀: {recommendation.et0} mm/jour</Text>
            <Text>ETc: {recommendation.etc} mm/jour</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  picker: {
    height: 50,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  resultSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default RecommendationsTester; 