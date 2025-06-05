import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import AnimatedBackground from '../components/AnimatedBackground';
import AvatarSelector from '../components/AvatarSelector';
import { useAuth } from '../contexts/auth';
import styles from '../styles/login.styles';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('person-circle');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  async function handleCadastro() {
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmarSenha.trim()) {
      setErro('Por favor, preencha todos os campos');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      await signUp(email, senha, nome, selectedAvatar);
      router.replace('/(app)');
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <AnimatedBackground />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.logo}>Cadastro</Text>

          <Text style={styles.label}>Escolha seu avatar:</Text>
          <AvatarSelector
            selectedAvatar={selectedAvatar}
            onSelect={setSelectedAvatar}
          />

          <TextInput
            placeholder="Nome"
            value={nome}
            onChangeText={text => {
              setNome(text);
              setErro('');
            }}
            placeholderTextColor="#FFD369"
            style={styles.input}
          />

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              setErro('');
            }}
            placeholderTextColor="#FFD369"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Senha"
            value={senha}
            onChangeText={text => {
              setSenha(text);
              setErro('');
            }}
            placeholderTextColor="#FFD369"
            style={styles.input}
            secureTextEntry
          />

          <TextInput
            placeholder="Confirmar Senha"
            value={confirmarSenha}
            onChangeText={text => {
              setConfirmarSenha(text);
              setErro('');
            }}
            placeholderTextColor="#FFD369"
            style={styles.input}
            secureTextEntry
          />

          {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

          <Pressable 
            style={styles.button}
            onPress={handleCadastro}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFD369" />
            ) : (
              <Text style={styles.buttonText}>Cadastrar</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.registerText}>
              Já tem uma conta? Faça login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 