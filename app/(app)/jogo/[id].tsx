import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Rating from '../../components/Rating';
import Parse from '../../config/parse';
import { useAuth } from '../../contexts/auth';
import { Game, getGameDetails, getGameScreenshots, getSimilarGames } from '../../services/rawg';

export default function GameDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [screenshots, setScreenshots] = useState<Game['screenshots']>([]);
  const [similarGames, setSimilarGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para avaliação
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [mediaAvaliacoes, setMediaAvaliacoes] = useState(0);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(true);

  useEffect(() => {
    async function loadGameData() {
      try {
        setLoading(true);
        const [gameData, screenshotsData, similarGamesData] = await Promise.all([
          getGameDetails(id as string),
          getGameScreenshots(id as string),
          getSimilarGames(id as string)
        ]);

        setGame(gameData);
        setScreenshots(screenshotsData);
        setSimilarGames(similarGamesData);
      } catch (error) {
        setError('Erro ao carregar informações do jogo');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadGameData();
    carregarAvaliacoes();
  }, [id]);

  async function carregarAvaliacoes() {
    setLoadingAvaliacoes(true);
    try {
      const query = new Parse.Query('GameRating');
      query.equalTo('gameId', id as string);
      query.include('user');
      query.descending('createdAt');
      
      const results = await query.find();
      setAvaliacoes(results);

      if (results.length > 0) {
        const soma = results.reduce((acc, curr) => acc + curr.get('rating'), 0);
        setMediaAvaliacoes(soma / results.length);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoadingAvaliacoes(false);
    }
  }

  async function enviarAvaliacao() {
    if (!isAuthenticated) {
      alert('Você precisa estar logado para avaliar');
      router.push('/(auth)/login');
      return;
    }

    if (rating === 0) {
      alert('Por favor, selecione uma avaliação');
      return;
    }

    setEnviandoAvaliacao(true);
    try {
      const GameRating = Parse.Object.extend('GameRating');
      const avaliacao = new GameRating();

      avaliacao.set('gameId', id as string);
      avaliacao.set('gameName', game?.name);
      avaliacao.set('rating', rating);
      avaliacao.set('comment', comentario.trim());
      avaliacao.set('user', user);

      await avaliacao.save();
      await carregarAvaliacoes();
      
      setRating(0);
      setComentario('');
      
      alert('Avaliação enviada com sucesso!');
    } catch (error: any) {
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD369" />
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Jogo não encontrado'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: game.background_image }}
        style={styles.coverImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.title}>{game.name}</Text>

        {/* Avaliações do App */}
        <View style={styles.avaliacaoContainer}>
          <Text style={styles.sectionTitle}>Avaliações dos Usuários</Text>
          {loadingAvaliacoes ? (
            <ActivityIndicator color="#FFD369" />
          ) : (
            <View style={styles.mediaContainer}>
              <Rating rating={Math.round(mediaAvaliacoes)} setRating={() => {}} disabled />
              <Text style={styles.mediaText}>
                {mediaAvaliacoes.toFixed(1)} ({avaliacoes.length} avaliações)
              </Text>
            </View>
          )}
        </View>

        {/* Formulário de Avaliação */}
        {isAuthenticated ? (
          <View style={styles.avaliacaoForm}>
            <Text style={styles.sectionTitle}>Sua Avaliação</Text>
            <Rating rating={rating} setRating={setRating} />
            
            <TextInput
              placeholder="Deixe seu comentário (opcional)"
              value={comentario}
              onChangeText={setComentario}
              style={styles.input}
              placeholderTextColor="#FFD369"
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Text style={styles.caracteresRestantes}>
              {500 - comentario.length} caracteres restantes
            </Text>

            <Pressable 
              style={[styles.button, !rating && styles.buttonDisabled]}
              onPress={enviarAvaliacao}
              disabled={enviandoAvaliacao || !rating}
            >
              {enviandoAvaliacao ? (
                <ActivityIndicator color="#1B1B2F" />
              ) : (
                <Text style={styles.buttonText}>
                  {rating ? 'Enviar Avaliação' : 'Selecione uma nota'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable 
            style={styles.button}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Faça login para avaliar</Text>
          </Pressable>
        )}

        {/* Lista de Avaliações */}
        <View style={styles.avaliacoesLista}>
          <Text style={styles.sectionTitle}>Últimas Avaliações</Text>
          {avaliacoes.length > 0 ? (
            avaliacoes.map((avaliacao, index) => (
              <View key={index} style={styles.avaliacaoItem}>
                <View style={styles.avaliacaoHeader}>
                  <View style={styles.usuarioInfo}>
                    <Ionicons 
                      name={avaliacao.get('user')?.get('avatar') || 'person-circle'} 
                      size={30} 
                      color="#FFD369" 
                    />
                    <Text style={styles.nomeUsuario}>
                      {avaliacao.get('user')?.get('name') || 'Usuário'}
                    </Text>
                  </View>
                  <Rating 
                    rating={avaliacao.get('rating')} 
                    setRating={() => {}} 
                    disabled 
                  />
                </View>
                {avaliacao.get('comment') && (
                  <Text style={styles.comentario}>
                    {avaliacao.get('comment')}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.semAvaliacoes}>
              Nenhuma avaliação ainda. Seja o primeiro a avaliar!
            </Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Data de Lançamento:</Text>
          <Text style={styles.infoText}>
            {new Date(game.released).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Gêneros:</Text>
          <Text style={styles.infoText}>
            {game.genres.map(g => g.name).join(', ')}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Plataformas:</Text>
          <Text style={styles.infoText}>
            {game.platforms.map(p => p.platform.name).join(', ')}
          </Text>
        </View>

        {game.esrb_rating && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Classificação ESRB:</Text>
            <Text style={styles.infoText}>{game.esrb_rating.name}</Text>
          </View>
        )}

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Descrição:</Text>
          <Text style={styles.description}>{game.description_raw}</Text>
        </View>

        {screenshots.length > 0 && (
          <View style={styles.screenshotsContainer}>
            <Text style={styles.screenshotsLabel}>Screenshots:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {screenshots.map(screenshot => (
                <Image
                  key={screenshot.id}
                  source={{ uri: screenshot.image }}
                  style={styles.screenshot}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {similarGames.length > 0 && (
          <View style={styles.similarGamesContainer}>
            <Text style={styles.similarGamesLabel}>Jogos da Série:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similarGames.map(similarGame => (
                <View key={similarGame.id} style={styles.similarGameCard}>
                  <Image
                    source={{ uri: similarGame.background_image }}
                    style={styles.similarGameImage}
                  />
                  <Text style={styles.similarGameTitle} numberOfLines={2}>
                    {similarGame.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1B2F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B2F',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B2F',
  },
  errorText: {
    color: '#FF6B6B',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
  },
  title: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 24,
    color: '#FFD369',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 16,
    color: '#FFD369',
    marginBottom: 12,
  },
  avaliacaoContainer: {
    marginBottom: 24,
  },
  mediaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  mediaText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#FFD369',
    marginLeft: 12,
  },
  avaliacaoForm: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1B1B2F',
    borderWidth: 2,
    borderColor: '#FFD369',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    marginTop: 12,
    textAlignVertical: 'top',
  },
  caracteresRestantes: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#FFD369',
    textAlign: 'right',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#FFD369',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#1B1B2F',
  },
  avaliacoesLista: {
    marginBottom: 24,
  },
  avaliacaoItem: {
    backgroundColor: '#1B1B2F',
    borderWidth: 2,
    borderColor: '#FFD369',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  avaliacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usuarioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nomeUsuario: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#FFD369',
    marginLeft: 8,
  },
  comentario: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 8,
  },
  semAvaliacoes: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#FFD369',
    textAlign: 'center',
    marginTop: 12,
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoLabel: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#FFD369',
    marginBottom: 4,
  },
  infoText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#FFFFFF',
  },
  descriptionContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  descriptionLabel: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: '#FFD369',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  screenshotsContainer: {
    marginBottom: 24,
  },
  screenshotsLabel: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: '#FFD369',
    marginBottom: 12,
  },
  screenshot: {
    width: 280,
    height: 158,
    marginRight: 12,
    borderRadius: 8,
  },
  similarGamesContainer: {
    marginBottom: 24,
  },
  similarGamesLabel: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    color: '#FFD369',
    marginBottom: 12,
  },
  similarGameCard: {
    width: 140,
    marginRight: 12,
  },
  similarGameImage: {
    width: 140,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarGameTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },
}); 