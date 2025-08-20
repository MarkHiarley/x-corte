'use client';

import { useState } from 'react';

const TestSchedule = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Dados de exemplo para teste
  const sampleScheduleData = {
    name: "Horário de Trabalho",
    timeZone: "America/Sao_Paulo",
    availability: [
      {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        startTime: "09:00",
        endTime: "18:00"
      },
      {
        days: ["Saturday"],
        startTime: "09:00",
        endTime: "14:00"
      }
    ],
    isDefault: true
  };

  const testCreateSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleScheduleData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro na requisição');
      }

      setResult(data);
      console.log('Sucesso:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teste de Criação de Schedule</h1>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Dados que serão enviados:</h3>
        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(sampleScheduleData, null, 2)}
        </pre>
      </div>

      <button
        onClick={testCreateSchedule}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-semibold ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {loading ? 'Testando...' : 'Testar Criação de Schedule'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg">
          <h3 className="text-red-800 font-semibold">Erro:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg">
          <h3 className="text-green-800 font-semibold">Sucesso!</h3>
          <pre className="text-green-700 text-sm mt-2 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestSchedule;
