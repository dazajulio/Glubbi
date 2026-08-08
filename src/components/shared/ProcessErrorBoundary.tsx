'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logProcessEvent } from '@/lib/audit-logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  restaurantId?: string;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ProcessErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ProcessErrorBoundary caught an error:', error, errorInfo);

    // Audit log error automatically
    logProcessEvent({
      restaurantId: this.props.restaurantId,
      action: 'REACT_RENDER_CRASH',
      category: 'ERROR_CRITICAL',
      details: error.message || 'Error no identificado en componente React',
      errorStack: `${error.stack || ''}\nComponentStack:${errorInfo.componentStack || ''}`
    });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-3xl my-6">
          <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900">
              {this.props.fallbackTitle || 'Ocurrió un inconveniente temporal en la vista'}
            </h2>

            <p className="text-sm text-slate-500">
              Nuestro sistema de auditoría procesó este evento automáticamente para prevenir interrupciones en tu servicio.
            </p>

            {this.state.error?.message && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-left text-xs font-mono text-slate-700 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-md text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar Vista
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
