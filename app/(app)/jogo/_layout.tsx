import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

export default function JogoLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1B1B2F',
        },
        headerTintColor: '#FFD369',
        headerTitleStyle: {
          fontFamily: 'PressStart2P_400Regular',
          fontSize: 14,
        },
        headerTitle: 'Detalhes do Jogo',
        headerLeft: () => (
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              marginLeft: 16
            })}
          >
            <Ionicons name="arrow-back" size={24} color="#FFD369" />
          </Pressable>
        ),
      }}
    />
  );
} 