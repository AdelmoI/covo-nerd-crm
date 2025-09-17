// src/app/page.tsx
'use client';

import { useState } from 'react';
import Logo from '@/components/ui/Logo';

export default function Home() {
  const [dbStatus, setDbStatus] = useState<string>('Non testato');
  const [modelsStatus, setModelsStatus] = useState<string>('Non testato');
  const [beeperStatus, setBeeperStatus] = useState<string>('Non testato');

  const testDatabase = async () => {
    setDbStatus('Testando...');
    try {
      const response = await fetch('/api/test/database');
      const data = await response.json();
      
      if (response.ok) {
        setDbStatus('✅ Connesso');
      } else {
        setDbStatus(`❌ Errore: ${data.error}`);
      }
    } catch (error) {
      setDbStatus('❌ Errore di connessione');
    }
  };

  const testModels = async () => {
    setModelsStatus('Testando...');
    try {
      const response = await fetch('/api/test/models', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setModelsStatus('✅ Modelli OK');
      } else {
        setModelsStatus(`❌ Errore: ${data.error}`);
      }
    } catch (error) {
      setModelsStatus('❌ Errore di connessione');
    }
  };

  const testBeeper = async () => {
    setBeeperStatus('Testando...');
    try {
      const response = await fetch('/api/test/beeper');
      const data = await response.json();
      
      if (response.ok) {
        setBeeperStatus('✅ Connesso');
      } else {
        setBeeperStatus(`❌ Errore: ${data.error}`);
      }
    } catch (error) {
      setBeeperStatus('❌ Errore di connessione');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
        </div>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Database MongoDB</h3>
            <p className="text-sm text-gray-600 mb-3">Status: {dbStatus}</p>
            <button
              onClick={testDatabase}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              style={{ backgroundColor: '#1D70B3' }}
            >
              Testa Connessione Database
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Modelli MongoDB</h3>
            <p className="text-sm text-gray-600 mb-3">Status: {modelsStatus}</p>
            <button
              onClick={testModels}
              className="w-full text-white py-2 px-4 rounded hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#8B5A2B' }}
            >
              Testa Modelli CRM
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Beeper API</h3>
            <p className="text-sm text-gray-600 mb-3">Status: {beeperStatus}</p>
            <button
              onClick={testBeeper}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
            >
              Testa Connessione Beeper
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Next.js + MongoDB + Beeper Integration
          </p>
        </div>
      </div>
    </div>
  );
}