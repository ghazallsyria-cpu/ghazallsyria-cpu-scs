// This file represents the entry point for a React Native mobile application.
// It demonstrates how to achieve a similar UI and functionality to the web app.
// Note: Assumes a React Native environment with necessary libraries like `react-native-dotenv`.

import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { StudentLevel, StructuredResponse } from '../types'; // Assuming types are shared

// --- Environment Variables for React Native ---
// import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
// For demonstration, we'll hardcode them here. In a real app, use react-native-dotenv.
const SUPABASE_URL = 'https://ghfkmnznnfbekjqytyty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZmttbnpubmZiZWtqcXl0eXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTM5NTEsImV4cCI6MjA4NTY2OTk1MX0.zea3iG2KVGifpfTX3kvSFVvSNTvjqbrFVPh97f8aMnw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const StudentMobileApp = () => {
    const [topic, setTopic] = useState<string>("قانون نيوتن الثاني");
    const [level, setLevel] = useState<StudentLevel>(StudentLevel.Intermediate);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<StructuredResponse | null>(null);

    const handleFetchExplanation = useCallback(async () => {
        if (!topic.trim()) {
            setError("الرجاء إدخال مفهوم فيزيائي.");
            return;
        }
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const { data, error } = await supabase.functions.invoke('physics-explanation', {
                body: { topic, level },
            });
            if (error) throw error;
            setResponse(data);
        } catch (err: any) {
            setError(err.message || "فشل استدعاء خدمة الذكاء الاصطناعي.");
        } finally {
            setLoading(false);
        }
    }, [topic, level]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>المركز السوري للعلوم</Text>
                
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>المفهوم الفيزيائي</Text>
                    <TextInput
                        style={styles.input}
                        value={topic}
                        onChangeText={setTopic}
                        placeholder="مثال: قانون الجذب العام"
                        placeholderTextColor="#888"
                    />
                    {/* A picker for level would go here */}
                    <Button title={loading ? "جاري التحميل..." : "اشرح المفهوم"} onPress={handleFetchExplanation} disabled={loading} color="#06b6d4" />
                </View>

                {loading && <ActivityIndicator size="large" color="#06b6d4" style={{ marginVertical: 20 }} />}
                
                {error && <Text style={styles.errorText}>{error}</Text>}

                {response && (
                    <View style={styles.responseContainer}>
                        <Text style={styles.responseTitle}>الفهم المفاهيمي</Text>
                        <Text style={styles.responseText}>{response.conceptual}</Text>
                        <Text style={styles.responseTitle}>التصور البصري</Text>
                        <Text style={styles.responseText}>{response.visual}</Text>
                        {/* More response sections would follow */}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0f172a' },
    container: { padding: 20, direction: 'rtl' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 },
    inputContainer: { backgroundColor: '#1e293b', padding: 15, borderRadius: 10, marginBottom: 20 },
    label: { fontSize: 18, color: '#06b6d4', marginBottom: 10, textAlign: 'right' },
    input: { backgroundColor: '#334155', color: 'white', padding: 12, borderRadius: 5, marginBottom: 15, textAlign: 'right' },
    errorText: { color: '#ef4444', textAlign: 'center', marginVertical: 10 },
    responseContainer: { marginTop: 20 },
    responseTitle: { fontSize: 22, fontWeight: 'bold', color: '#f59e0b', marginBottom: 8, textAlign: 'right' },
    responseText: { fontSize: 16, color: '#cbd5e1', lineHeight: 24, marginBottom: 15, textAlign: 'right' },
});

export default StudentMobileApp;
