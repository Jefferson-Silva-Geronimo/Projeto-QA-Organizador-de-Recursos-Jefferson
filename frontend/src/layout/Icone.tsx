/** Ícones simples de traço, sempre decorativos: o rótulo de texto vem ao lado (F6-08). */
const CAMINHOS: Record<string, string> = {
  T02: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4',
  T03: 'M12 5v14M5 12h14',
  T04: 'M5 6h14M5 12h14M5 18h9',
  T05: 'm5 12 5 5 9-10',
  T06: 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0 8 4m0 0 8-4m-8 4v8',
  T07: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  T08: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Z',
  T09: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  T10: 'M5 20V10M12 20V4M19 20v-7',
  T11: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 9a6 6 0 0 1 12 0M17 11a3 3 0 1 0-1-5.8M21 20a6 6 0 0 0-4-5.6',
  MAIS: 'M5 12h.01M12 12h.01M19 12h.01',
};

export function Icone({ nome }: { nome: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={CAMINHOS[nome] ?? CAMINHOS.T02} />
    </svg>
  );
}
