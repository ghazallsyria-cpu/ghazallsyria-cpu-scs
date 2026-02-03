import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StudentLevel, StructuredResponse } from '../types';
import { supabase } from '../supabaseClient';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Icons remain the same...
const FlaskConicalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v12m-8-8h16M12 3l8 9H4l8-9z" />
    </svg>
);
const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);
const CalculatorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
    </svg>
);
const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);
const BeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 00-.517-3.86l2.387-.477a2 2 0 001.022-.547zM14.79 8.21a4 4 0 01-5.656 0M9 10h6" />
    </svg>
);

const KatexRenderer: React.FC<{ content: string }> = ({ content }) => {
    const containerRef = useRef<HTMLParagraphElement>(null);
    useEffect(() => {
        if (containerRef.current) {
            const processedContent = content.replace(/`([^`]+)`/g, (match, formula) => {
                return katex.renderToString(formula, { throwOnError: false, displayMode: false });
            });
            containerRef.current.innerHTML = processedContent;
        }
    }, [content]);
    return <p ref={containerRef} className="text-slate-300 whitespace-pre-wrap leading-relaxed"></p>;
};

const ResponseCard: React.FC<{ icon: React.ReactNode; title: string; content: string; color: string; isMathematical?: boolean }> = ({ icon, title, content, color, isMathematical = false }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 backdrop-blur-sm h-full">
        <div className={`flex items-center space-x-3 space-x-reverse mb-4 text-${color}`}>
            {icon}
            <h3 className="text-xl font-bold">{title}</h3>
        </div>
        {isMathematical ? <KatexRenderer content={content} /> : <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{content}</p>}
    </div>
);

const LessonShowcase: React.FC = () => {
    const [topic, setTopic] = useState<string>("قانون نيوتن الثاني في الحركة");
    const [level, setLevel] = useState<StudentLevel>(StudentLevel.Intermediate);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<StructuredResponse | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError("الرجاء إدخال مفهوم فيزيائي.");
            return;
        }
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            // Securely call the Supabase Edge Function
            const { data, error: functionError } = await supabase.functions.invoke('ai-request-handler', {
                body: { topic, level },
            });

            if (functionError) throw functionError;
            
            setResponse(data);
        } catch (err: any) {
            setError(err.message || "فشل استدعاء خدمة الذكاء الاصطناعي.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [topic, level]);

    return (
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-xl border border-slate-800 shadow-2xl shadow-cyan-500/5">
            <h2 className="text-2xl font-bold text-white mb-4">مولد الشروحات الفيزيائية</h2>
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="mb-4">
                    <label htmlFor="topic" className="block text-lg font-semibold text-cyan-400 mb-2">
                        المفهوم الفيزيائي
                    </label>
                    <input id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثال: قانون الجذب العام" className="w-full bg-slate-800 border border-slate-600 rounded-md py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all" required />
                </div>
                <div className="mb-6">
                    <label htmlFor="level" className="block text-lg font-semibold text-cyan-400 mb-2">
                        مستوى الطالب
                    </label>
                    <select id="level" value={level} onChange={(e) => setLevel(e.target.value as StudentLevel)} className="w-full bg-slate-800 border border-slate-600 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all appearance-none">
                        {Object.values(StudentLevel).map((val) => (<option key={val} value={val}>{val}</option>))}
                    </select>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-cyan-600 text-white font-bold py-3 px-6 rounded-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center">
                    {loading ? (<> <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> ... جاري بناء المفهوم </> ) : ( 'اشرح المفهوم' )}
                </button>
            </form>

            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-center">{error}</div>}

            {response && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ResponseCard icon={<LightbulbIcon />} title="الفهم المفاهيمي" content={response.conceptual} color="amber-400" />
                    <ResponseCard icon={<FlaskConicalIcon />} title="التصور البصري" content={response.visual} color="sky-400" />
                    <ResponseCard icon={<CalculatorIcon />} title="التمثيل الرياضي" content={response.mathematical} color="lime-400" isMathematical={true} />
                    <ResponseCard icon={<BookOpenIcon />} title="استراتيجية حل المسائل" content={response.problemSolving} color="violet-400" />
                    <div className="md:col-span-2">
                        <ResponseCard icon={<BeakerIcon />} title="تجربة مقترحة" content={response.experiment} color="teal-400" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonShowcase;
