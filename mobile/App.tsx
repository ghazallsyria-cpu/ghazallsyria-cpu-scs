import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { supabase } from './supabaseClient';

// Assuming types are shared or duplicated in the mobile project
enum StudentLevel {
  Beginner = 'مبتدئ',
  Intermediate = 'متوسط',
  Advanced = 'متقدم',
}
interface StructuredResponse {
  conceptual: string;
  visual: string;
  mathematical: string;
  problemSolving: string;
  experiment: string;
}

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
            const { data, error: funcError } = await supabase.functions.invoke('ai-request-handler', {
                body: { topic, level },
            });
            if (funcError) throw funcError;
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
                    {/* A picker for level would go here in a real app */}
                    <Pressable
                        style={({ pressed }) => [styles.button, { opacity: pressed || loading ? 0.7 : 1 }]}
                        onPress={handleFetchExplanation}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? "جاري التحميل..." : "اشرح المفهوم"}
                        </Text>
                    </Pressable>
                </View>

                {loading && <ActivityIndicator size="large" color="#06b6d4" style={{ marginVertical: 20 }} />}
                
                {error && <Text style={styles.errorText}>{error}</Text>}

                {response && (
                    <View style={styles.responseContainer}>
                        <Text style={styles.responseTitle}>الفهم المفاهيمي</Text>
                        <Text style={styles.responseText}>{response.conceptual}</Text>
                        
                        <Text style={styles.responseTitle}>التصور البصري</Text>
                        <Text style={styles.responseText}>{response.visual}</Text>

                        <Text style={styles.responseTitle}>التمثيل الرياضي</Text>
                        <Text style={styles.responseText}>{response.mathematical}</Text>

                        <Text style={styles.responseTitle}>استراتيجية حل المسائل</Text>
                        <Text style={styles.responseText}>{response.problemSolving}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0f172a' },
    container: { padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 },
    inputContainer: { backgroundColor: '#1e293b', padding: 15, borderRadius: 10, marginBottom: 20 },
    label: { fontSize: 18, color: '#06b6d4', marginBottom: 10, textAlign: 'right', fontWeight: '600' },
    input: { backgroundColor: '#334155', color: 'white', padding: 12, borderRadius: 5, marginBottom: 15, textAlign: 'right', fontSize: 16 },
    button: { backgroundColor: '#0891b2', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    errorText: { color: '#ef4444', textAlign: 'center', marginVertical: 10, fontSize: 16 },
    responseContainer: { marginTop: 20 },
    responseTitle: { fontSize: 22, fontWeight: 'bold', color: '#f59e0b', marginBottom: 8, textAlign: 'right' },
    responseText: { fontSize: 16, color: '#cbd5e1', lineHeight: 24, marginBottom: 15, textAlign: 'right' },
});

export default StudentMobileApp;
