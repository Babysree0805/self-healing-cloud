import React from 'react';
import { AlertTriangle, RefreshCw, Home, Shield } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Rydex ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center p-6 bg-[#0B0F17] text-slate-100 font-sans">
          <div className="max-w-lg w-full glass-card border border-red-500/40 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                  Service Isolated
                </span>
                <span className="text-xs font-mono text-slate-400">Autonomous SRE Protection</span>
              </div>
              <h2 className="text-lg font-bold text-white">Component Temporarily Safeguarded</h2>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                An unexpected exception was safely intercepted by the Rydex Self-Healing Runtime. The rest of the platform remains healthy.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-left text-[11px] text-red-300 overflow-x-auto max-h-24">
                <strong>Error: </strong>{this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#ffe633] text-black font-extrabold text-xs yellow-glow transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recover Component</span>
              </button>

              <button
                onClick={() => {
                  window.location.hash = 'passenger';
                  window.location.reload();
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Rydex Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
