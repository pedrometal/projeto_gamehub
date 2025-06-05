import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedBackground from '../components/AnimatedBackground';
import Rating from '../components/Rating';
import Parse from '../config/parse';
import { useAuth } from '../contexts/auth';

export default function MinhasAvaliacoes() {
  const router = useRouter();
  const { user } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  async function carregarAvaliacoes() {
    setLoading(true);
    setErro('');
    try {
      const query = new Parse.Query('GameRating');
      query.equalTo('user', user);
      query.descending('createdAt');
      
      const results = await query.find();
      setAvaliacoes(results);
    } catch (error: any) {
      console.error('Erro ao carregar avaliações:', error);
      setErro('Não foi possível carregar suas avaliações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

  async function excluirAvaliacao(avaliacaoId: string) {
    try {
      const query = new Parse.Query('GameRating');
      const avaliacao = await query.get(avaliacaoId);
      await avaliacao.destroy();
      
      // Atualiza a lista após excluir
      await carregarAvaliacoes();
      alert('Avaliação excluída com sucesso!');
    } catch (error: any) {
      alert('Erro ao excluir avaliação: ' + error.message);
    }
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1B1B2F',
          },
          headerTintColor: '#FFD369',
          headerTitle: 'Minhas Avaliações',
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

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFD369" style={styles.loading} />
        ) : erro ? (
          <Text style={styles.erro}>{erro}</Text>
        ) : avaliacoes.length === 0 ? (
          <Text style={styles.semAvaliacoes}>
            Você ainda não avaliou nenhum jogo.
          </Text>
        ) : (
          avaliacoes.map((avaliacao) => (
            <View key={avaliacao.id} style={styles.avaliacaoItem}>
              <Text style={styles.tituloJogo}>{avaliacao.get('gameName')}</Text>
              
              <Rating 
                rating={avaliacao.get('rating')} 
                setRating={() => {}} 
                disabled 
              />

              {avaliacao.get('comment') && (
                <Text style={styles.comentario}>
                  {avaliacao.get('comment')}
                </Text>
              )}

              <View style={styles.botoesContainer}>
                <Pressable 
                  style={styles.botaoVerJogo}
                  onPress={() => router.push({
                    pathname: '/(avaliar)/[id]',
                    params: {
                      id: avaliacao.get('gameId'),
                      nome: avaliacao.get('gameName'),
                    }
                  })}
                >
                  <Text style={styles.botaoTexto}>Ver Jogo</Text>
                </Pressable>

                <Pressable 
                  style={styles.botaoExcluir}
                  onPress={() => excluirAvaliacao(avaliacao.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.botaoVoltarContainer}>
        <Pressable 
          style={styles.botaoVoltar}
          onPress={() => router.back()}
        >
          <Text style={styles.botaoTexto}>Voltar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#1B1B2F',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  loading: {
    marginTop: 20,
  },
  erro: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  semAvaliacoes: {
    color: '#FFD369',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontStyle: 'italic',
  },
  avaliacaoItem: {
    backgroundColor: 'rgba(27, 27, 47, 0.8)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: '#FFD369',
    borderWidth: 2,
  },
  tituloJogo: {
    color: '#FFD369',
    fontSize: 18,
    fontFamily: 'PressStart2P_400Regular',
    marginBottom: 10,
    textAlign: 'center',
  },
  comentario: {
    color: '#FFD369',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 15,
  },
  botoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  botaoVerJogo: {
    backgroundColor: '#FFD369',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  botaoExcluir: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  botaoVoltarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1B1B2F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#FFD369',
  },
  botaoVoltar: {
    backgroundColor: '#FFD369',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoTexto: {
    color: '#1B1B2F',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
}); 