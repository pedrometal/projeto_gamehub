import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../contexts/auth';
import styles from '../styles/home.styles';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <AnimatedBackground />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>App de Jogos</Text>
        <Text style={styles.subtitle}>Organize seus jogos favoritos!</Text>

        <Pressable style={styles.button} onPress={() => router.push('/jogos')}>
          <Text style={styles.buttonText}>Avaliação do APP</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => router.push('/buscar')}>
          <Text style={styles.buttonText}>Buscar Jogos</Text>
        </Pressable>

        {isAuthenticated && (
          <Pressable 
            style={styles.button} 
            onPress={() => router.push('/perfil')}
          >
            <Text style={styles.buttonText}>Meu Perfil</Text>
          </Pressable>
        )}

        <Pressable style={styles.button} onPress={() => router.push('/sobre')}>
          <Text style={styles.buttonText}>Sobre o App</Text>
        </Pressable>
      </View>
    </View>
  );
} 