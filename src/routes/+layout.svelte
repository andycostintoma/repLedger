<script lang="ts">
  import { browser, dev } from '$app/environment';
  import { page } from '$app/state';
  import '../app.css';

  let { children } = $props();

  const tabs = [
    { href: '/workout', icon: '▣', label: 'Workout' },
    { href: '/mesos', icon: '◫', label: 'Mesos' },
    { href: '/templates', icon: '▤', label: 'Templates' },
    { href: '/exercises', icon: '◉', label: 'Exercises' }
  ];

  const isActive = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

  if (browser && dev && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister();
      }
    });
  }
</script>

<main class="min-h-dvh w-full overflow-x-hidden bg-transparent pb-28 text-neutral-100 sm:px-4 sm:py-4">
  <section class="mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-neutral-950 shadow-2xl shadow-black/40 sm:rounded-[2rem] sm:ring-1 sm:ring-white/10">
    {@render children()}
  </section>

  <nav class="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2" aria-label="Primary">
    <div class="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-[1.4rem] border border-white/10 bg-neutral-950/95 p-2 shadow-2xl shadow-black/50 backdrop-blur">
      {#each tabs as tab}
        <a class={`grid gap-1 rounded-2xl px-2 py-2 text-center text-xs font-black transition ${isActive(tab.href) ? 'bg-cyan-300 text-neutral-950 shadow-lg shadow-cyan-950/30' : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-200'}`} href={tab.href}>
          <span class="text-lg leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </a>
      {/each}
    </div>
  </nav>
</main>
