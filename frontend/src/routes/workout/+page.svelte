<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { formatBodyweightLoad, isBodyweightLoadableEquipment, parseBodyweightLoad } from '$lib/training/equipment';
  import type { MuscleGroup, PlannedExercise } from '$lib/training/model';
  import { muscleTone } from '$lib/training/presentation';
  import { finishWorkout, saveExerciseFeedback, saveLoggedSet, saveMuscleFeedback, saveSuggestion } from './workout.remote';

  let { data } = $props();

  let savingSet = $state<string | null>(null);
  let savingFeedback = $state<string | null>(null);
  let saveError = $state<string | null>(null);
  let showWorkoutMenu = $state(false);

  const setIndexes = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

  const groupExercises = (exercises: PlannedExercise[]) => {
    const groups = new Map<MuscleGroup, PlannedExercise[]>();

    exercises.forEach((exercise) => {
      groups.set(exercise.primaryMuscle, [...(groups.get(exercise.primaryMuscle) ?? []), exercise]);
    });

    return [...groups.entries()].map(([muscle, exercises]) => ({ muscle, exercises }));
  };

  const nullableNumber = (formData: FormData, key: string) => {
    const raw = String(formData.get(key) ?? '').trim();

    return raw.length > 0 ? Number(raw) : null;
  };

  const nullableText = (formData: FormData, key: string) => {
    const raw = String(formData.get(key) ?? '').trim();

    return raw.length > 0 ? raw : null;
  };

  const saveSet = async (event: SubmitEvent, exercise: PlannedExercise, setIndex: number) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;

    const formData = new FormData(event.currentTarget);
    const bodyweightValue = String(formData.get('bodyweight') ?? '').trim();
    const addedWeightValue = String(formData.get('addedWeight') ?? '').trim();
    const loadText = isBodyweightLoadableEquipment(exercise.equipment)
      ? formatBodyweightLoad(bodyweightValue, addedWeightValue.length > 0 ? addedWeightValue : '0')
      : String(formData.get('loadText') ?? '').trim();
    const reps = Number(formData.get('reps'));
    const painValue = String(formData.get('pain') ?? '').trim();
    const key = `${exercise.id}-${setIndex}`;

    if (isBodyweightLoadableEquipment(exercise.equipment) && bodyweightValue.length === 0) {
      saveError = 'Enter bodyweight for bodyweight/loadable exercises.';
      return;
    }

    savingSet = key;
    saveError = null;

    const result = await saveLoggedSet({
      sessionId: data.workout.sessionId,
      templateExerciseId: exercise.id,
      setIndex,
      loadText,
      reps,
      notes: nullableText(formData, 'notes'),
      pain: painValue.length > 0 ? Number(painValue) : null
    });

    savingSet = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    await invalidateAll();
  };

  const saveExercise = async (event: SubmitEvent, templateExerciseId: string) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;

    const formData = new FormData(event.currentTarget);
    const key = `exercise-${templateExerciseId}`;

    savingFeedback = key;
    saveError = null;

    const result = await saveExerciseFeedback({
      sessionId: data.workout.sessionId,
      templateExerciseId,
      painAfter: nullableNumber(formData, 'painAfter'),
      notes: nullableText(formData, 'exerciseNotes')
    });

    savingFeedback = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    await invalidateAll();
  };

  const saveMuscle = async (event: SubmitEvent, muscle: MuscleGroup) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;

    const formData = new FormData(event.currentTarget);
    const workloadValue = String(formData.get('workload') ?? '').trim();
    const key = `muscle-${muscle}`;

    savingFeedback = key;
    saveError = null;

    const result = await saveMuscleFeedback({
      sessionId: data.workout.sessionId,
      muscle,
      soreness: nullableNumber(formData, 'soreness'),
      pump: nullableNumber(formData, 'pump'),
      workload: workloadValue === 'too-low' || workloadValue === 'good' || workloadValue === 'too-high' ? workloadValue : null,
      notes: nullableText(formData, 'muscleNotes')
    });

    savingFeedback = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    await invalidateAll();
  };

  const saveSuggestionForm = async (event: SubmitEvent, muscle: MuscleGroup) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;

    const formData = new FormData(event.currentTarget);
    const status = String(formData.get('status') ?? 'proposed');
    const suggestion = String(formData.get('suggestion') ?? '').trim();
    const key = `suggestion-${muscle}`;

    if (status !== 'proposed' && status !== 'accepted' && status !== 'ignored' && status !== 'edited') return;

    savingFeedback = key;
    saveError = null;

    const result = await saveSuggestion({ sessionId: data.workout.sessionId, muscle, suggestion, status });

    savingFeedback = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    await invalidateAll();
  };

  const finishCurrentWorkout = async () => {
    savingFeedback = 'finish-workout';
    saveError = null;

    const result = await finishWorkout({ sessionId: data.workout.sessionId });

    savingFeedback = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    await invalidateAll();
  };
</script>

<svelte:head>
  <title>Workout</title>
  <meta name="description" content="Internal workout tracker" />
</svelte:head>

<section class="w-full overflow-x-hidden px-4 pb-6 pt-4">
  <header class="sticky top-0 z-10 -mx-4 border-b border-white/10 bg-neutral-950/95 px-4 pb-3 pt-2 backdrop-blur">
    <div class="flex items-center justify-between gap-3">
      <a class="grid size-10 place-items-center rounded-full bg-neutral-900 text-lg ring-1 ring-white/10" href="/mesos" aria-label="Open current mesocycle">◷</a>
      <div class="text-center">
        <p class="text-xs font-bold uppercase tracking-[0.28em] text-neutral-500">Week 1 Day 4</p>
        <h1 class="text-xl font-black tracking-tight">{data.workout.name}</h1>
        <p class="text-xs text-neutral-400">{data.workout.date ? `${data.workout.date} · ` : ''}{data.workout.status}</p>
      </div>
      <button class="grid size-10 place-items-center rounded-full bg-neutral-900 text-lg ring-1 ring-white/10 transition hover:bg-neutral-800" type="button" aria-label="Workout menu" onclick={() => (showWorkoutMenu = !showWorkoutMenu)}>⋯</button>
    </div>
    {#if showWorkoutMenu}
      <div class="mt-3 grid gap-2 rounded-2xl bg-neutral-900 p-3 text-sm ring-1 ring-white/10">
        <a class="rounded-xl bg-neutral-950 px-3 py-3 text-left font-black text-neutral-100 ring-1 ring-white/5" href="/mesos">View current meso calendar</a>
        <a class="rounded-xl bg-neutral-950 px-3 py-3 text-left font-black text-neutral-100 ring-1 ring-white/5" href="/templates">Open templates</a>
        <a class="rounded-xl bg-neutral-950 px-3 py-3 text-left font-black text-neutral-100 ring-1 ring-white/5" href="/exercises">Open exercises</a>
      </div>
    {/if}
    {#if saveError}
      <p class="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/30">{saveError}</p>
    {/if}
    {#if data.workout.status !== 'completed'}
      <button class="mt-3 w-full rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-neutral-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200 disabled:opacity-60" disabled={savingFeedback === 'finish-workout'} type="button" onclick={finishCurrentWorkout}>
        {savingFeedback === 'finish-workout' ? 'Finishing...' : 'Finish workout'}
      </button>
    {/if}
  </header>

  <section class="mt-4 overflow-hidden rounded-3xl bg-neutral-900/90 p-4 shadow-xl shadow-black/20 ring-1 ring-white/10">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Facts</p>
        <h2 class="mt-1 text-lg font-black">Volume so far</h2>
      </div>
      <span class="rounded-full bg-neutral-950 px-3 py-1 text-xs text-neutral-300">effective sets</span>
    </div>
    <div class="scrollbar-none -mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
      {#each data.workout.volumeFacts as fact}
        <div class="w-28 shrink-0 snap-start rounded-2xl bg-neutral-950 p-3 ring-1 ring-white/5">
          <p class="text-xs uppercase tracking-wide text-neutral-500">{fact.muscle}</p>
          <p class="mt-2 text-lg font-black">{fact.sessionEffectiveSets}</p>
          <p class="text-xs text-neutral-400">week {fact.weekToDateEffectiveSets}</p>
        </div>
      {/each}
    </div>
  </section>

  <section class="mt-5 grid min-w-0 gap-6" aria-label="Workout exercises">
    {#each groupExercises(data.workout.exercises) as group}
      <section class="grid min-w-0 gap-3">
        <div class="flex items-center gap-2">
          <span class={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ring-1 ${muscleTone(group.muscle)}`}>{group.muscle}</span>
          <div class="h-px flex-1 bg-white/10"></div>
        </div>

        {#each group.exercises as exercise}
          <article class="min-w-0 rounded-[1.6rem] bg-neutral-900 p-4 shadow-2xl shadow-black/25 ring-1 ring-white/10">
            <div class="flex min-w-0 items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-lg font-black leading-tight">{exercise.name}</h2>
                <p class="mt-1 text-sm text-neutral-400">{exercise.equipment} · {exercise.method} · {exercise.programmedSets} sets</p>
              </div>
              <span class="shrink-0 rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-neutral-300 ring-1 ring-white/10">{exercise.targetRepRange}</span>
            </div>

            <div class="mt-4 rounded-2xl bg-cyan-300/10 p-3 text-sm text-cyan-100 ring-1 ring-cyan-200/20">Previous: {exercise.previousPerformance}</div>

            <div class="mt-3 grid min-w-0 gap-2">
              {#each setIndexes(exercise.programmedSets) as setIndex}
                {@const savedSet = exercise.loggedSets.find((set) => set.setIndex === setIndex)}
                {@const saveKey = `${exercise.id}-${setIndex}`}
                <form class={`grid min-w-0 items-end gap-2 rounded-2xl bg-neutral-950 p-2 ring-1 ring-white/5 ${isBodyweightLoadableEquipment(exercise.equipment) ? 'grid-cols-[1rem_1.5rem_minmax(0,1fr)_minmax(0,1fr)_4rem_2.75rem]' : 'grid-cols-[1rem_1.5rem_minmax(0,1fr)_4rem_2.75rem]'}`} onsubmit={(event) => saveSet(event, exercise, setIndex)}>
                  <span class="pb-3 text-center text-lg leading-none text-neutral-600">⋮</span>
                  <p class="pb-3 text-sm font-black text-neutral-300">{setIndex}</p>
                  {#if isBodyweightLoadableEquipment(exercise.equipment)}
                    {@const parsedLoad = parseBodyweightLoad(savedSet?.loadText ?? '')}
                    <label class="grid min-w-0 gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-500">
                      Bodyweight
                      <input class="min-w-0 rounded-xl border border-white/10 bg-neutral-900 px-2 py-3 text-base text-neutral-100 outline-none focus:border-cyan-300" name="bodyweight" type="number" min="0" step="0.1" value={parsedLoad?.bodyweight ?? ''} placeholder="kg" required />
                    </label>
                    <label class="grid min-w-0 gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-500">
                      Added
                      <input class="min-w-0 rounded-xl border border-white/10 bg-neutral-900 px-2 py-3 text-base text-neutral-100 outline-none focus:border-cyan-300" name="addedWeight" type="number" min="0" step="0.1" value={parsedLoad?.addedWeight ?? '0'} placeholder="0" />
                    </label>
                  {:else}
                    <label class="grid min-w-0 gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-500">
                      Weight
                      <input class="min-w-0 rounded-xl border border-white/10 bg-neutral-900 px-2 py-3 text-base text-neutral-100 outline-none focus:border-cyan-300" name="loadText" value={savedSet?.loadText ?? ''} placeholder="kg/setup" required />
                    </label>
                  {/if}
                  <label class="grid min-w-0 gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-500">
                    Reps
                    <input class="min-w-0 rounded-xl border border-white/10 bg-neutral-900 px-2 py-3 text-base text-neutral-100 outline-none focus:border-cyan-300" name="reps" type="number" min="0" max="100" value={savedSet?.reps ?? ''} required />
                  </label>
                  <input name="notes" type="hidden" value={savedSet?.notes ?? ''} />
                  <input name="pain" type="hidden" value={savedSet?.pain ?? ''} />
                  <button class={`grid size-11 place-items-center rounded-xl text-lg font-black ring-1 ${savedSet ? 'bg-emerald-400 text-neutral-950 ring-emerald-300' : 'bg-neutral-900 text-neutral-500 ring-white/10'}`} disabled={savingSet === saveKey} type="submit" aria-label="Save set">
                    {savingSet === saveKey ? '…' : '✓'}
                  </button>
                </form>
              {/each}
            </div>

            <form class="mt-3 rounded-2xl bg-neutral-950 p-3 ring-1 ring-white/5" onsubmit={(event) => saveExercise(event, exercise.id)}>
              <p class="text-sm font-black text-neutral-200">After exercise</p>
              <div class="mt-2 grid grid-cols-[4.5rem_1fr] gap-2">
                <label class="grid gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-500">
                  Pain
                  <input class="rounded-xl border border-white/10 bg-neutral-900 px-2 py-3 text-base text-neutral-100 outline-none focus:border-cyan-300" name="painAfter" type="number" min="0" max="10" value={exercise.feedback?.painAfter ?? ''} />
                </label>
                <label class="grid gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-500">
                  Notes
                  <input class="rounded-xl border border-white/10 bg-neutral-900 px-3 py-3 text-base text-neutral-100 outline-none focus:border-cyan-300" name="exerciseNotes" value={exercise.feedback?.notes ?? ''} placeholder="optional" />
                </label>
              </div>
              <button class="mt-2 w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm font-black text-neutral-100 ring-1 ring-white/10 disabled:opacity-60" disabled={savingFeedback === `exercise-${exercise.id}`} type="submit">
                {savingFeedback === `exercise-${exercise.id}` ? 'Saving...' : 'Save feedback'}
              </button>
            </form>
          </article>
        {/each}
      </section>
    {/each}
  </section>

  <section class="mt-6 rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10">
    <p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Muscle check-ins</p>
    <div class="mt-3 grid gap-3">
      {#each data.workout.muscleFeedback as feedback}
        <form class="rounded-2xl bg-neutral-950 p-3 ring-1 ring-white/5" onsubmit={(event) => saveMuscle(event, feedback.muscle)}>
          <p class="text-sm font-black">{feedback.muscle}</p>
          <div class="mt-2 grid grid-cols-3 gap-2">
            <input class="rounded-xl border border-white/10 bg-neutral-900 px-2 py-3 text-base outline-none focus:border-cyan-300" name="soreness" type="number" min="0" max="5" value={feedback.soreness ?? ''} placeholder="sore" />
            <input class="rounded-xl border border-white/10 bg-neutral-900 px-2 py-3 text-base outline-none focus:border-cyan-300" name="pump" type="number" min="0" max="5" value={feedback.pump ?? ''} placeholder="pump" />
            <select class="rounded-xl border border-white/10 bg-neutral-900 px-2 py-3 text-base outline-none focus:border-cyan-300" name="workload" value={feedback.workload ?? ''}>
              <option value="">work</option>
              <option value="too-low">low</option>
              <option value="good">good</option>
              <option value="too-high">high</option>
            </select>
          </div>
          <input class="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-3 text-base outline-none focus:border-cyan-300" name="muscleNotes" value={feedback.notes ?? ''} placeholder="notes" />
          <button class="mt-2 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-neutral-950 disabled:opacity-60" disabled={savingFeedback === `muscle-${feedback.muscle}`} type="submit">
            {savingFeedback === `muscle-${feedback.muscle}` ? 'Saving...' : 'Save check-in'}
          </button>
        </form>
      {/each}
    </div>
  </section>

  <section class="mt-6 rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10">
    <p class="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Next session</p>
    <h2 class="mt-1 text-lg font-black">Suggestions</h2>
    {#if data.workout.suggestions.length === 0}
      <p class="mt-3 rounded-2xl bg-neutral-950 p-3 text-sm text-neutral-400">Save muscle or pain feedback to generate proposed next-session changes.</p>
    {:else}
      <div class="mt-3 grid gap-3">
        {#each data.workout.suggestions as suggestion}
          <form class="rounded-2xl bg-neutral-950 p-3 ring-1 ring-white/5" onsubmit={(event) => saveSuggestionForm(event, suggestion.muscle)}>
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-black">{suggestion.muscle}</p>
              <span class="rounded-full bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-200">{suggestion.status}</span>
            </div>
            <textarea class="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-3 text-sm outline-none focus:border-cyan-300" name="suggestion" required>{suggestion.suggestion}</textarea>
            <div class="mt-2 grid grid-cols-[1fr_6rem] gap-2">
              <select class="rounded-xl border border-white/10 bg-neutral-900 px-3 py-3 text-sm outline-none focus:border-cyan-300" name="status" value={suggestion.status}>
                <option value="proposed">proposed</option>
                <option value="accepted">accept</option>
                <option value="ignored">ignore</option>
                <option value="edited">edited</option>
              </select>
              <button class="rounded-xl bg-neutral-800 px-4 py-3 text-sm font-black ring-1 ring-white/10 disabled:opacity-60" disabled={savingFeedback === `suggestion-${suggestion.muscle}`} type="submit">Save</button>
            </div>
          </form>
        {/each}
      </div>
    {/if}
  </section>
</section>
