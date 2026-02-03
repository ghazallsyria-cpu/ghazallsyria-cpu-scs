import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { DrawingData } from '../types';

const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#FFFFFF');
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    
    // To store the last position {x, y}
    const lastPos = useRef<{x: number, y: number} | null>(null);

    // Effect for initializing canvas and Supabase channel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Set canvas dimensions based on container size
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = 500; // Fixed height
            }
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = color;
        context.lineWidth = 5;
        contextRef.current = context;

        // --- Supabase Realtime Setup ---
        const channel = supabase.channel('whiteboard-channel');
        channelRef.current = channel;

        channel.on('broadcast', { event: 'drawing' }, ({ payload }) => {
            const data: DrawingData = payload;
            drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.tool, false);
        });

        channel.on('broadcast', { event: 'clear' }, () => {
             if (contextRef.current && canvasRef.current) {
                contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        });
        
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Connected to whiteboard channel.');
            }
        });

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    // Effect for updating context properties when tool or color changes
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = tool === 'eraser' ? 20 : 5;
            contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        }
    }, [color, tool]);
    
    const getMousePos = (e: React.MouseEvent): { x: number, y: number } => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e);
        lastPos.current = { x, y };
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !lastPos.current) return;
        
        const { x, y } = getMousePos(e);
        const { x: lastX, y: lastY } = lastPos.current;

        const data: DrawingData = {
            x0: lastX / canvasRef.current!.width,
            y0: lastY / canvasRef.current!.height,
            x1: x / canvasRef.current!.width,
            y1: y / canvasRef.current!.height,
            color,
            tool
        };
        
        drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.tool, true);
        
        lastPos.current = { x, y };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const drawLine = (x0: number, y0: number, x1: number, y1: number, lineColor: string, lineTool: 'pen' | 'eraser', emit: boolean) => {
        const context = contextRef.current;
        const canvas = canvasRef.current;
        if (!context || !canvas) return;

        context.beginPath();
        context.moveTo(x0 * canvas.width, y0 * canvas.height);
        context.lineTo(x1 * canvas.width, y1 * canvas.height);
        
        // Apply settings for the incoming line
        context.strokeStyle = lineColor;
        context.lineWidth = lineTool === 'eraser' ? 20 : 5;
        context.globalCompositeOperation = lineTool === 'eraser' ? 'destination-out' : 'source-over';
        
        context.stroke();
        
        // Restore own settings
        context.strokeStyle = color;
        context.lineWidth = tool === 'eraser' ? 20 : 5;
        context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

        if (!emit || !channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'drawing',
            payload: { x0, y0, x1, y1, color: lineColor, tool: lineTool },
        });
    };
    
    const handleClearCanvas = () => {
        if (contextRef.current && canvasRef.current) {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'clear',
                });
            }
        }
    };


    return (
        <div className="bg-slate-900/60 p-6 md:p-8 rounded-xl border border-slate-800 shadow-2xl shadow-cyan-500/5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setTool('pen')} className={`p-2 rounded-md ${tool === 'pen' ? 'bg-cyan-600' : 'bg-slate-700'} hover:bg-cyan-500 transition-colors`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => setTool('eraser')} className={`p-2 rounded-md ${tool === 'eraser' ? 'bg-cyan-600' : 'bg-slate-700'} hover:bg-cyan-500 transition-colors`}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <div className="flex items-center gap-3">
                     <label htmlFor="colorPicker" className="text-white">اللون:</label>
                    <input id="colorPicker" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 bg-slate-800 border-slate-600 rounded-md cursor-pointer"/>
                </div>
                 <button onClick={handleClearCanvas} className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-500 transition-colors">
                    مسح اللوحة
                </button>
            </div>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="bg-slate-800 rounded-md w-full cursor-crosshair"
            />
        </div>
    );
};

export default Whiteboard;
