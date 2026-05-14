@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", ui-serif, Georgia, serif;

  --color-primary: #111827;
}

@layer base {
  body {
    @apply bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-pink-100 selection:text-pink-600;
    -webkit-tap-highlight-color: transparent;
  }

  h1, h2, h3, h4 {
    @apply font-serif tracking-tight font-medium;
  }

  /* Custom selection color */
  ::selection {
    background: #fce7f3; /* pink-100 */
    color: #db2777; /* pink-600 */
  }
}

@layer components {
  .btn-primary {
    @apply px-8 py-4 bg-slate-900 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none;
  }

  .btn-secondary {
    @apply px-8 py-4 bg-white text-slate-700 rounded-2xl font-medium border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-95 transition-all duration-300;
  }

  .input {
    @apply px-6 py-4 bg-white rounded-2xl border border-slate-100 text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all placeholder:text-slate-300 outline-none capitalize;
  }

  .card {
    @apply bg-white rounded-[2.5rem] shadow-sm border border-slate-50 transition-all duration-500;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
