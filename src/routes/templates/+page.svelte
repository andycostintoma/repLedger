<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { TemplateMesocycleSummary } from '$lib/server/training/types';
  import { addMesocycle, addTemplateMesocycle } from './templates.remote';

  let { data } = $props();

  let savingCatalog = $state<string | null>(null);
  let saveError = $state<string | null>(null);
  let showAddTemplate = $state(false);
  let templateFilter = $state('');
  let templateCategoryFilter = $state('all');

  const selectedTemplate = () => data.catalog.templateMesocycles.find((template) => template.id === data.selectedTemplateId) ?? null;

  const filteredTemplates = () => {
    const query = templateFilter.trim().toLowerCase();
    const category = templateCategoryFilter.toLowerCase();

    return data.catalog.templateMesocycles.filter((template) =>
      (category === 'all' || template.category.toLowerCase() === category) &&
      (query.length === 0 || `${template.name} ${template.category} ${template.frequency}`.toLowerCase().includes(query))
    );
  };

  const resetTemplateFilters = () => {
    templateFilter = '';
    templateCategoryFilter = 'all';
  };

  const createMesoFromTemplate = async (template: TemplateMesocycleSummary) => {
    savingCatalog = `template-${template.id}`;
    saveError = null;

    const result = await addMesocycle({
      name: `${template.name} meso`,
      status: 'planned',
      weeks: template.weeks,
      daysPerWeek: template.daysPerWeek,
      templateMesoId: template.id
    });

    savingCatalog = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    await invalidateAll();
  };

  const saveTemplate = async (event: SubmitEvent) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    const form = event.currentTarget;
    const formData = new FormData(form);

    savingCatalog = 'template';
    saveError = null;

    const result = await addTemplateMesocycle({
      name: String(formData.get('name') ?? '').trim(),
      category: String(formData.get('category') ?? '').trim(),
      frequency: String(formData.get('frequency') ?? '').trim(),
      gender: String(formData.get('gender') ?? '').trim(),
      weeks: Number(formData.get('weeks')),
      daysPerWeek: Number(formData.get('daysPerWeek'))
    });

    savingCatalog = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    form.reset();
    showAddTemplate = false;
    await invalidateAll();
  };
</script>

<svelte:head>
  <title>Templates</title>
</svelte:head>

<section class="px-4 pb-6 pt-5">
  {#if selectedTemplate()}
    {@const template = selectedTemplate()}
    {#if template}
      <header class="sticky top-0 z-10 -mx-4 border-b border-white/10 bg-neutral-950/95 px-4 pb-3 pt-2 backdrop-blur">
        <a class="rounded-full bg-neutral-900 px-4 py-2 text-sm font-black text-neutral-200 ring-1 ring-white/10" href="/templates">← Templates</a>
        <p class="mt-4 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{template.category}</p>
        <h1 class="mt-1 text-3xl font-black tracking-tight">{template.name}</h1>
        <p class="mt-1 text-sm text-neutral-400">{template.frequency} · {template.gender}</p>
      </header>

      <section class="mt-4 grid gap-3">
        <div class="grid grid-cols-3 gap-2">
          <div class="rounded-2xl bg-neutral-900 p-3 text-center ring-1 ring-white/10">
            <p class="text-2xl font-black">{template.weeks}</p>
            <p class="text-xs text-neutral-500">weeks</p>
          </div>
          <div class="rounded-2xl bg-neutral-900 p-3 text-center ring-1 ring-white/10">
            <p class="text-2xl font-black">{template.daysPerWeek}</p>
            <p class="text-xs text-neutral-500">days/week</p>
          </div>
          <div class="rounded-2xl bg-neutral-900 p-3 text-center ring-1 ring-white/10">
            <p class="text-2xl font-black">{template.category.slice(0, 1)}</p>
            <p class="text-xs text-neutral-500">category</p>
          </div>
        </div>

        <article class="rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10">
          <h2 class="text-lg font-black">Template actions</h2>
          <p class="mt-2 text-sm text-neutral-400">Create a planned mesocycle from this template. Editing the day-by-day template is a separate workflow.</p>
          <button class="mt-4 w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-neutral-950 disabled:opacity-60" disabled={savingCatalog === `template-${template.id}`} type="button" onclick={() => createMesoFromTemplate(template)}>
            {savingCatalog === `template-${template.id}` ? 'Creating...' : 'Create planned meso'}
          </button>
        </article>
      </section>
    {/if}
  {:else}
    <header class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-black tracking-tight">Templates</h1>
        <p class="mt-1 text-sm text-neutral-400">Template mesos</p>
      </div>
      <button class="grid size-11 place-items-center rounded-full bg-cyan-300 text-2xl font-black text-neutral-950" type="button" aria-label={`${showAddTemplate ? 'Close' : 'Add'} Templates`} onclick={() => (showAddTemplate = !showAddTemplate)}>{showAddTemplate ? '×' : '+'}</button>
    </header>
    {#if saveError}
      <p class="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/30">{saveError}</p>
    {/if}
    <input class="mt-4 w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none focus:border-cyan-300" bind:value={templateFilter} placeholder="Search templates" />
    <div class="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs font-black uppercase tracking-wide">
      <button class={`rounded-full px-3 py-2 ${templateCategoryFilter === 'all' ? 'bg-cyan-300 text-neutral-950' : 'bg-neutral-900 text-neutral-300 ring-1 ring-white/10'}`} type="button" onclick={() => (templateCategoryFilter = 'all')}>All</button>
      <button class={`rounded-full px-3 py-2 ${templateCategoryFilter === 'Hypertrophy' ? 'bg-cyan-300 text-neutral-950' : 'bg-neutral-900 text-neutral-300 ring-1 ring-white/10'}`} type="button" onclick={() => (templateCategoryFilter = 'Hypertrophy')}>Hypertrophy</button>
      <button class={`rounded-full px-3 py-2 ${templateCategoryFilter === 'Base' ? 'bg-cyan-300 text-neutral-950' : 'bg-neutral-900 text-neutral-300 ring-1 ring-white/10'}`} type="button" onclick={() => (templateCategoryFilter = 'Base')}>Base</button>
    </div>
    {#if showAddTemplate}
      <form class="mt-4 rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10" onsubmit={saveTemplate}>
        <input class="w-full rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="name" placeholder="Template name" required />
        <div class="mt-2 grid grid-cols-2 gap-2">
          <input class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="category" value="Hypertrophy" placeholder="Category" required />
          <input class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="frequency" value="6 days/week" placeholder="Frequency" required />
          <input class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="gender" value="All" placeholder="Gender" required />
          <input class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="weeks" type="number" min="1" max="52" value="8" aria-label="Weeks" required />
          <input class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="daysPerWeek" type="number" min="1" max="7" value="6" aria-label="Days per week" required />
        </div>
        <button class="mt-3 w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-neutral-950 disabled:opacity-60" disabled={savingCatalog === 'template'} type="submit">{savingCatalog === 'template' ? 'Adding...' : '+ Add template'}</button>
      </form>
    {/if}
    {#if filteredTemplates().length === 0}
      <div class="mt-4 rounded-3xl bg-neutral-900 p-5 text-center ring-1 ring-white/10">
        <p class="text-lg font-black">No templates found</p>
        <p class="mt-1 text-sm text-neutral-400">Clear the search and category filters to see the full template list.</p>
        <button class="mt-4 rounded-2xl bg-neutral-800 px-4 py-3 text-sm font-black text-neutral-100 ring-1 ring-white/10" type="button" onclick={resetTemplateFilters}>Reset filters</button>
      </div>
    {:else}
      <div class="mt-4 grid gap-3">
        {#each filteredTemplates() as template}
          <a class="rounded-3xl bg-neutral-900 p-4 text-left ring-1 ring-white/10 transition hover:bg-neutral-800" href={`/templates?template=${template.id}`}>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{template.category}</p>
            <h2 class="mt-1 text-lg font-black">{template.name}</h2>
            <div class="mt-3 flex flex-wrap gap-2 text-xs font-bold text-neutral-300">
              <span class="rounded-full bg-neutral-950 px-3 py-1 ring-1 ring-white/10">{template.frequency}</span>
              <span class="rounded-full bg-neutral-950 px-3 py-1 ring-1 ring-white/10">{template.gender}</span>
              <span class="rounded-full bg-neutral-950 px-3 py-1 ring-1 ring-white/10">{template.weeks} weeks</span>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</section>
