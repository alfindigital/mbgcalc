import React from "react";

interface State {
  hasError: boolean;
}

/**
 * Menangkap error render agar app tidak menampilkan layar putih total.
 * Memberi pesan ramah + tombol muat ulang.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("Render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="text-center max-w-sm">
            <h1 className="text-2xl font-extrabold text-primary mb-2">Aduh, ada yang error</h1>
            <p className="text-sm text-muted-foreground mb-5">
              Terjadi kesalahan tak terduga. Coba muat ulang halaman.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-accent transition-colors"
            >
              Muat ulang
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
