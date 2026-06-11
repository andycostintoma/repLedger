<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { muscleTone } from '$lib/training/presentation';
  import type { MesocycleSessionSummary, MesocycleSummary } from '$lib/server/training/types';
  import { addMesocycle } from './mesos.remote';

  let { data } = $props();

  let savingCatalog = $state<string | null>(null);
  let saveError = $state<string | null>(null);
  let showAddMeso = $state(false);

  const selectedMeso = () => data.catalog.mesocycles.find((mesocycle) => mesocycle.id === data.selectedMesoId) ?? null;
  const mesoWeeks = (mesocycle: MesocycleSummary) => Array.from({ length: mesocycle.weeks }, (_, index) => index + 1);
  const mesoDays = (mesocycle: MesocycleSummary) => Array.from({ length: mesocycle.daysPerWeek }, (_, index) => index + 1);
  const sessionForDay = (mesocycle: MesocycleSummary, week: number, day: number) => mesocycle.sessions.find((session) => session.weekNumber === week && session.dayNumber === day) ?? null;

  const selectedMesoSession = () => {
    const mesocycle = selectedMeso();

    if (!mesocycle) return null;

    return mesocycle.sessions.find((session) => session.id === data.selectedSessionId) ?? mesocycle.sessions[0] ?? null;
  };

  const mesoHref = (mesocycle: MesocycleSummary, session: MesocycleSessionSummary | null = mesocycle.sessions[0] ?? null) => {
    const params = new URLSearchParams({ meso: mesocycle.id });
    if (session) params.set('session', session.id);
    return `/mesos?${params.toString()}`;
  };

  const saveMesocycle = async (event: SubmitEvent) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const status = String(formData.get('status') ?? 'planned');

    if (status !== 'current' && status !== 'planned' && status !== 'completed') return;

    savingCatalog = 'meso';
    saveError = null;

    const result = await addMesocycle({
      name: String(formData.get('name') ?? '').trim(),
      status,
      weeks: Number(formData.get('weeks')),
      daysPerWeek: Number(formData.get('daysPerWeek')),
      templateMesoId: null
    });

    savingCatalog = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    form.reset();
    showAddMeso = false;
    await invalidateAll();
  };
</script>

<svelte:head>
  <title>Mesos</title>
</svelte:head>

<section class="w-full overflow-x-hidden px-4 pb-6 pt-5">
  {#if selectedMeso()}
    {@const mesocycle = selectedMeso()}
    {#if mesocycle}
      <header class="sticky top-0 z-10 -mx-4 border-b border-white/10 bg-neutral-950/95 px-4 pb-3 pt-2 backdrop-blur">
        <a class="rounded-full bg-neutral-900 px-4 py-2 text-sm font-black text-neutral-200 ring-1 ring-white/10" href="/mesos">← Mesos</a>
        <div class="mt-4 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{mesocycle.status}</p>
            <h1 class="mt-1 text-2xl font-black tracking-tight">{mesocycle.name}</h1>
            <p class="mt-1 text-sm text-neutral-400">{mesocycle.weeks} weeks · {mesocycle.daysPerWeek} days/week</p>
          </div>
          <span class="rounded-2xl bg-neutral-900 px-3 py-2 text-right text-xs font-black text-neutral-300 ring-1 ring-white/10">{mesocycle.sessionCount}<br />sessions</span>
        </div>
      </header>

      <section class="mt-4 overflow-hidden rounded-[1.6rem] bg-neutral-900 p-4 ring-1 ring-white/10" aria-label="Mesocycle calendar">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm text-neutral-400">Weeks</p>
            <p class="mt-1 text-xs text-neutral-500">Tap a completed day to inspect that workout.</p>
          </div>
          <span class="rounded-full bg-neutral-950 px-3 py-1 text-xs font-black text-neutral-300 ring-1 ring-white/10">{mesocycle.latestSession ?? 'no sessions'}</span>
        </div>

        <div class="scrollbar-none -mx-4 mt-4 overflow-x-auto px-4 pb-1">
          <div class="grid min-w-max gap-2" style={`grid-template-columns: repeat(${mesocycle.weeks}, minmax(4.25rem, 1fr));`}>
            {#each mesoWeeks(mesocycle) as week}
              <div class="text-center">
                <p class="text-xl font-black text-neutral-200">{week}</p>
                <p class="text-xs text-neutral-500">week</p>
              </div>
            {/each}

            {#each mesoDays(mesocycle) as day}
              {#each mesoWeeks(mesocycle) as week}
                {@const session = sessionForDay(mesocycle, week, day)}
                {#if session}
                  <a class={`grid h-16 place-items-center rounded-xl text-lg font-black ring-1 transition ${data.selectedSessionId === session.id ? 'bg-emerald-400 text-neutral-950 ring-emerald-200' : 'bg-emerald-500/35 text-emerald-200 ring-emerald-400/40'}`} href={mesoHref(mesocycle, session)} aria-label={`Week ${week} day ${day}`}>D{day}</a>
                {:else}
                  <span class="grid h-16 place-items-center rounded-xl bg-neutral-950 text-lg font-black text-neutral-700 ring-1 ring-white/5" aria-label={`Week ${week} day ${day}`}>D{day}</span>
                {/if}
              {/each}
            {/each}
          </div>
        </div>
      </section>

      {#if selectedMesoSession()}
        {@const session = selectedMesoSession()}
        {#if session}
          <section class="mt-5" aria-label="Selected mesocycle day">
            <article class="min-w-0 rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10">
              <div class="flex min-w-0 items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">W{session.weekNumber ?? '?'} D{session.dayNumber ?? '?'}</p>
                  <h2 class="mt-1 text-2xl font-black">{session.name}</h2>
                  <p class="mt-1 text-sm text-neutral-400">{session.trainingDate ? `${session.trainingDate} · ` : ''}{session.status} · {session.totalSets} sets</p>
                </div>
                <span class="shrink-0 rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-neutral-300 ring-1 ring-white/10">{session.exercises.length} exercises</span>
              </div>

              <div class="mt-4 grid gap-3">
                {#each session.exercises as exercise}
                  <details class="min-w-0 rounded-2xl bg-neutral-950 p-3 ring-1 ring-white/5">
                    <summary class="cursor-pointer list-none">
                      <div class="flex min-w-0 items-start justify-between gap-3">
                        <div class="min-w-0">
                          <span class={`rounded-full px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ring-1 ${muscleTone(exercise.primaryMuscle)}`}>{exercise.primaryMuscle}</span>
                          <h3 class="mt-2 text-base font-black text-neutral-100">{exercise.name}</h3>
                          <p class="mt-1 text-sm text-neutral-500">{exercise.equipment} · {exercise.method}</p>
                        </div>
                        <span class="rounded-full bg-neutral-900 px-2 py-1 text-xs font-bold text-neutral-300">{exercise.sets.length} sets</span>
                      </div>
                    </summary>
                    <div class="mt-3 grid gap-1">
                      <div class="grid grid-cols-[2.5rem_1fr_4rem] px-3 text-xs font-black uppercase tracking-wide text-neutral-500">
                        <span>Set</span>
                        <span>Weight</span>
                        <span class="text-right">Reps</span>
                      </div>
                      {#each exercise.sets as set}
                        <div class="grid grid-cols-[2.5rem_1fr_4rem] rounded-xl bg-neutral-900 px-3 py-2 text-sm">
                          <span class="font-black text-neutral-500">{set.setIndex}</span>
                          <span class="text-neutral-200">{set.loadText}</span>
                          <span class="text-right font-black text-neutral-100">{set.reps}</span>
                        </div>
                      {/each}
                    </div>
                  </details>
                {/each}
              </div>
            </article>
          </section>
        {/if}
      {:else}
        <p class="mt-5 rounded-3xl bg-neutral-900 p-4 text-sm text-neutral-400 ring-1 ring-white/10">No sessions attached to this mesocycle yet.</p>
      {/if}
    {/if}
  {:else}
    <header class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-black tracking-tight">Mesocycles</h1>
        <p class="mt-1 text-sm text-neutral-400">Past blocks and current meso</p>
      </div>
      <button class="grid size-11 place-items-center rounded-full bg-cyan-300 text-2xl font-black text-neutral-950" type="button" aria-label={`${showAddMeso ? 'Close' : 'Add'} Mesocycles`} onclick={() => (showAddMeso = !showAddMeso)}>{showAddMeso ? '×' : '+'}</button>
    </header>
    {#if saveError}
      <p class="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/30">{saveError}</p>
    {/if}
    {#if showAddMeso}
      <form class="mt-4 rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10" onsubmit={saveMesocycle}>
        <div class="grid grid-cols-[1fr_6rem] gap-2">
          <input class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="name" placeholder="New mesocycle" required />
          <select class="rounded-2xl border border-white/10 bg-neutral-950 px-2 py-3 outline-none focus:border-cyan-300" name="status" required>
            <option value="planned">planned</option>
            <option value="current">current</option>
            <option value="completed">done</option>
          </select>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <input class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="weeks" type="number" min="1" max="52" value="8" aria-label="Weeks" required />
          <input class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="daysPerWeek" type="number" min="1" max="7" value="6" aria-label="Days per week" required />
        </div>
        <button class="mt-3 w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-neutral-950 disabled:opacity-60" disabled={savingCatalog === 'meso'} type="submit">{savingCatalog === 'meso' ? 'Adding...' : '+ Add meso'}</button>
      </form>
    {/if}
    <div class="mt-4 grid gap-3">
      {#each data.catalog.mesocycles as mesocycle}
        <a class="min-w-0 rounded-3xl bg-neutral-900 p-4 text-left ring-1 ring-white/10 transition hover:bg-neutral-800" href={mesoHref(mesocycle)}>
          <div class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">{mesocycle.weeks} weeks · {mesocycle.daysPerWeek} days/week</p>
              <h2 class="mt-1 text-lg font-black">{mesocycle.name}</h2>
              <p class="mt-2 text-sm text-neutral-400">{mesocycle.sessionCount} sessions{mesocycle.latestSession ? ` · latest ${mesocycle.latestSession}` : ''}</p>
            </div>
            <span class={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${mesocycle.status === 'current' ? 'bg-emerald-300 text-neutral-950' : 'bg-neutral-800 text-neutral-300'}`}>{mesocycle.status === 'completed' ? '✓' : mesocycle.status}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>
