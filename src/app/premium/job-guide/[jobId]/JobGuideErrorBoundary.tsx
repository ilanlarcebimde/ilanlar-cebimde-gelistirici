"use client";

import React from "react";
import Link from "next/link";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class JobGuideErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[JobGuideErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg p-6 text-center">
          <p className="text-slate-700">Bir hata oluştu. Paneli tekrar açmayı deneyin.</p>
          <Link
            href="/premium/job-guides"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Başvuru paneline dön
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}
