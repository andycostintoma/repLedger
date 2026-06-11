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

<main class="min-h-screen bg-neutral-950 pb-28 text-neutral-100">
  <section class="mx-auto min-h-screen max-w-md bg-neutral-950">
    {@render children()}
  </section>

  <nav class="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-neutral-950/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 backdrop-blur" aria-label="Primary">
    <div class="mx-auto grid max-w-md grid-cols-4 gap-2">
      {#each tabs as tab}
        <a class={`grid gap-1 rounded-2xl px-2 py-2 text-center text-xs font-black ${isActive(tab.href) ? 'bg-cyan-300 text-neutral-950' : 'text-neutral-500'}`} href={tab.href}>
          <span class="text-lg leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </a>
      {/each}
    </div>
  </nav>
</main>
