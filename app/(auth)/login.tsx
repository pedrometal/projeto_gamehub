import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../contexts/auth';
import styles from '../styles/login.styles';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      setErro('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      await signIn(email, senha);
      router.replace('/(app)');
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer login. Tente novamente.');
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
          <Text style={styles.logo}>Game Hub</Text>

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

          {erro ? <Text style={styles.errorText}>{erro}</Text> : null}

          <Pressable 
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFD369" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/cadastro')}>
            <Text style={styles.registerText}>
              Não tem uma conta? Cadastre-se
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 