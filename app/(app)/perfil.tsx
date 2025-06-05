import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AnimatedBackground from '../components/AnimatedBackground';
import AvatarSelector from '../components/AvatarSelector';
import Rating from '../components/Rating';
import Parse from '../config/parse';
import { useAuth } from '../contexts/auth';

export default function PerfilScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    totalAvaliacoes: 0,
    mediaNotas: 0,
    totalComentarios: 0,
  });

  // Estados para edição de perfil
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loadingAtualizacao, setLoadingAtualizacao] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.get('avatar') || 'person-circle');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    if (!user) return;

    try {
      const query = new Parse.Query('GameRating');
      query.equalTo('user', user);
      query.descending('createdAt');
      
      const results = await query.find();
      setAvaliacoes(results);

      const totalAvaliacoes = results.length;
      const avaliacoesComComentario = results.filter(a => a.get('comment')?.trim()).length;
      
      let somaNotas = 0;
      results.forEach(avaliacao => {
        somaNotas += avaliacao.get('rating');
      });

      setEstatisticas({
        totalAvaliacoes,
        mediaNotas: totalAvaliacoes > 0 ? somaNotas / totalAvaliacoes : 0,
        totalComentarios: avaliacoesComComentario,
      });

      // Carrega o avatar salvo
      setSelectedAvatar(user.get('avatar') || 'person-circle');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarAvatar(novoAvatar: string) {
    try {
      setLoadingAtualizacao(true);
      
      // Atualiza localmente primeiro para feedback imediato
      setSelectedAvatar(novoAvatar);

      // Atualiza o avatar usando o usuário atual
      const currentUser = Parse.User.current();
      if (!currentUser) {
        throw new Error('Usuário não encontrado');
      }

      // Atualiza apenas o campo avatar
      await Parse.Cloud.run('atualizarAvatar', { 
        userId: currentUser.id,
        avatar: novoAvatar 
      });

      alert('Avatar atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar avatar:', error);
      // Reverte para o avatar anterior em caso de erro
      setSelectedAvatar(user?.get('avatar') || 'person-circle');
      alert('Não foi possível atualizar o avatar. Tente novamente mais tarde.');
    } finally {
      setLoadingAtualizacao(false);
    }
  }

  async function atualizarEmail() {
    if (!novoEmail.trim()) {
      alert('Por favor, insira um novo email.');
      return;
    }

    setLoadingAtualizacao(true);
    try {
      user?.set('email', novoEmail);
      await user?.save();
      alert('Email atualizado com sucesso!');
      setNovoEmail('');
      setMostrarConfiguracoes(false);
    } catch (error: any) {
      alert('Erro ao atualizar email: ' + error.message);
    } finally {
      setLoadingAtualizacao(false);
    }
  }

  async function atualizarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      alert('A nova senha e a confirmação não coincidem.');
      return;
    }

    setLoadingAtualizacao(true);
    try {
      await Parse.User.logIn(user?.get('username'), senhaAtual);
      user?.set('password', novaSenha);
      await user?.save();
      alert('Senha atualizada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setMostrarConfiguracoes(false);
    } catch (error: any) {
      alert('Erro ao atualizar senha: ' + error.message);
    } finally {
      setLoadingAtualizacao(false);
    }
  }

  async function excluirAvaliacao(avaliacaoId: string) {
    try {
      const query = new Parse.Query('GameRating');
      const avaliacao = await query.get(avaliacaoId);
      await avaliacao.destroy();
      
      await carregarDados();
      alert('Avaliação excluída com sucesso!');
    } catch (error: any) {
      alert('Erro ao excluir avaliação: ' + error.message);
    }
  }

  function confirmarLogout() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sair',
          onPress: () => signOut()
        }
      ]
    );
  }

  if (!user) {
    router.replace('/(auth)/login');
    return null;
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
          headerTitle: 'Meu Perfil',
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
          headerRight: () => (
            <Pressable 
              onPress={() => setMostrarConfiguracoes(!mostrarConfiguracoes)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                marginRight: 16
              })}
            >
              <Ionicons 
                name={mostrarConfiguracoes ? "close" : "settings-outline"} 
                size={24} 
                color="#FFD369" 
              />
            </Pressable>
          ),
        }} 
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.perfilHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name={selectedAvatar} size={100} color="#FFD369" />
          </View>
          <Text style={styles.nomeUsuario}>{user?.get('name')}</Text>
          <Text style={styles.email}>{user?.get('email')}</Text>
        </View>

        {mostrarConfiguracoes ? (
          <View style={styles.configuracoesContainer}>
            <Text style={styles.configuracoesTitulo}>Configurações</Text>

            <View style={styles.secaoConfiguracao}>
              <Text style={styles.secaoTitulo}>Escolha seu Avatar</Text>
              <AvatarSelector
                selectedAvatar={selectedAvatar}
                onSelect={atualizarAvatar}
              />
            </View>

            <View style={styles.secaoConfiguracao}>
              <Text style={styles.secaoTitulo}>Alterar Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Novo email"
                placeholderTextColor="rgba(255, 211, 105, 0.5)"
                value={novoEmail}
                onChangeText={setNovoEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable 
                style={styles.botaoConfiguracoes}
                onPress={atualizarEmail}
                disabled={loadingAtualizacao}
              >
                {loadingAtualizacao ? (
                  <ActivityIndicator color="#1B1B2F" />
                ) : (
                  <Text style={styles.botaoTexto}>Atualizar Email</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.secaoConfiguracao}>
              <Text style={styles.secaoTitulo}>Alterar Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="Senha atual"
                placeholderTextColor="rgba(255, 211, 105, 0.5)"
                value={senhaAtual}
                onChangeText={setSenhaAtual}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Nova senha"
                placeholderTextColor="rgba(255, 211, 105, 0.5)"
                value={novaSenha}
                onChangeText={setNovaSenha}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar nova senha"
                placeholderTextColor="rgba(255, 211, 105, 0.5)"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
              />
              <Pressable 
                style={styles.botaoConfiguracoes}
                onPress={atualizarSenha}
                disabled={loadingAtualizacao}
              >
                {loadingAtualizacao ? (
                  <ActivityIndicator color="#1B1B2F" />
                ) : (
                  <Text style={styles.botaoTexto}>Atualizar Senha</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#FFD369" style={styles.loading} />
        ) : (
          <>
            <View style={styles.estatisticasContainer}>
              <Text style={styles.estatisticasTitulo}>Suas Estatísticas</Text>
              
              <View style={styles.estatisticaItem}>
                <Ionicons name="star" size={24} color="#FFD369" />
                <View style={styles.estatisticaTexto}>
                  <Text style={styles.estatisticaValor}>{estatisticas.totalAvaliacoes}</Text>
                  <Text style={styles.estatisticaLabel}>Avaliações Feitas</Text>
                </View>
              </View>

              <View style={styles.estatisticaItem}>
                <Ionicons name="trophy" size={24} color="#FFD369" />
                <View style={styles.estatisticaTexto}>
                  <Text style={styles.estatisticaValor}>
                    {estatisticas.mediaNotas.toFixed(1)}
                  </Text>
                  <Text style={styles.estatisticaLabel}>Média das Notas</Text>
                </View>
              </View>

              <View style={styles.estatisticaItem}>
                <Ionicons name="chatbubble" size={24} color="#FFD369" />
                <View style={styles.estatisticaTexto}>
                  <Text style={styles.estatisticaValor}>{estatisticas.totalComentarios}</Text>
                  <Text style={styles.estatisticaLabel}>Comentários Feitos</Text>
                </View>
              </View>
            </View>

            <View style={styles.avaliacoesContainer}>
              <Text style={styles.avaliacoesTitulo}>Minhas Avaliações</Text>
              
              {avaliacoes.length === 0 ? (
                <Text style={styles.semAvaliacoes}>
                  Você ainda não avaliou nenhum jogo.
                </Text>
              ) : (
                avaliacoes.map((avaliacao) => (
                  <View key={avaliacao.id} style={styles.avaliacaoItem}>
                    <View style={styles.avaliacaoHeader}>
                      <View style={styles.usuarioInfo}>
                        <Ionicons 
                          name={selectedAvatar} 
                          size={30} 
                          color="#FFD369" 
                        />
                        <Text style={styles.tituloJogo}>{avaliacao.get('gameName')}</Text>
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

                    <View style={styles.botoesAvaliacao}>
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
            </View>
          </>
        )}

        <Pressable 
          style={[styles.botao, styles.botaoSair]}
          onPress={confirmarLogout}
        >
          <Text style={[styles.botaoTexto, styles.botaoSairTexto]}>Sair da Conta</Text>
        </Pressable>
      </ScrollView>
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
    paddingBottom: 40,
  },
  perfilHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  nomeUsuario: {
    color: '#FFD369',
    fontSize: 24,
    fontFamily: 'PressStart2P_400Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    color: '#FFD369',
    fontSize: 14,
    opacity: 0.8,
  },
  configuracoesContainer: {
    backgroundColor: 'rgba(27, 27, 47, 0.8)',
    padding: 20,
    borderRadius: 10,
    borderColor: '#FFD369',
    borderWidth: 2,
    marginBottom: 20,
  },
  configuracoesTitulo: {
    color: '#FFD369',
    fontSize: 18,
    fontFamily: 'PressStart2P_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  secaoConfiguracao: {
    marginBottom: 20,
  },
  secaoTitulo: {
    color: '#FFD369',
    fontSize: 16,
    fontFamily: 'PressStart2P_400Regular',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFD369',
    borderRadius: 8,
    padding: 12,
    color: '#FFD369',
    marginBottom: 10,
  },
  botaoConfiguracoes: {
    backgroundColor: '#FFD369',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  estatisticasContainer: {
    backgroundColor: 'rgba(27, 27, 47, 0.8)',
    padding: 20,
    borderRadius: 10,
    borderColor: '#FFD369',
    borderWidth: 2,
    marginBottom: 20,
  },
  estatisticasTitulo: {
    color: '#FFD369',
    fontSize: 18,
    fontFamily: 'PressStart2P_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  estatisticaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 211, 105, 0.1)',
    padding: 15,
    borderRadius: 8,
  },
  estatisticaTexto: {
    marginLeft: 15,
  },
  estatisticaValor: {
    color: '#FFD369',
    fontSize: 20,
    fontWeight: 'bold',
  },
  estatisticaLabel: {
    color: '#FFD369',
    fontSize: 14,
    opacity: 0.8,
  },
  avaliacoesContainer: {
    backgroundColor: 'rgba(27, 27, 47, 0.8)',
    padding: 20,
    borderRadius: 10,
    borderColor: '#FFD369',
    borderWidth: 2,
    marginBottom: 20,
  },
  avaliacoesTitulo: {
    color: '#FFD369',
    fontSize: 18,
    fontFamily: 'PressStart2P_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  avaliacaoItem: {
    backgroundColor: 'rgba(255, 211, 105, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  avaliacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  usuarioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tituloJogo: {
    color: '#FFD369',
    fontSize: 14,
    fontFamily: 'PressStart2P_400Regular',
    flex: 1,
  },
  comentario: {
    color: '#FFD369',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 15,
  },
  botoesAvaliacao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  botao: {
    backgroundColor: '#FFD369',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoSair: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  botaoTexto: {
    color: '#1B1B2F',
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  botaoSairTexto: {
    color: '#FF6B6B',
  },
  loading: {
    marginTop: 20,
  },
  semAvaliacoes: {
    color: '#FFD369',
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
}); 