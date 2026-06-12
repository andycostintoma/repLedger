<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { equipmentTypes, isEquipmentType } from '$lib/training/equipment';
  import { muscleTone } from '$lib/training/presentation';
  import { addExercise, saveExerciseMuscles, saveExerciseName } from './exercises.remote';

  import type { MuscleCoefficientValue } from '$lib/server/training/domain/coefficients';
  import type { MuscleGroup } from '$lib/server/training/domain/muscles';

  let { data } = $props();

  let savingCatalog = $state<string | null>(null);
  let saveError = $state<string | null>(null);
  let showAddExercise = $state(false);
  let showEditName = $state(false);
  let showEditMuscles = $state(false);
  let exerciseFilter = $state('');
  let exerciseEquipmentFilter = $state('all');
  let exerciseMuscleFilter = $state('all');

  const selectedExercise = () => data.catalog.exercises.find((exercise) => exercise.id === data.selectedExerciseId) ?? null;

  const filteredExercises = () => {
    const query = exerciseFilter.trim().toLowerCase();
    const equipment = exerciseEquipmentFilter;
    const muscle = exerciseMuscleFilter.toLowerCase();

    return data.catalog.exercises.filter((exercise) =>
      (equipment === 'all' || exercise.equipment === equipment) &&
      (muscle === 'all' || exercise.muscleCoefficients.some((coefficient) => coefficient.muscle.toLowerCase() === muscle)) &&
      (query.length === 0 || `${exercise.name} ${exercise.muscleCoefficients.map((coefficient) => coefficient.muscle).join(' ')} ${exercise.equipment}`.toLowerCase().includes(query))
    );
  };

  const exerciseMuscleOptions = () => ['all', ...data.catalog.muscleGroups];

  const familyName = (familyId: string | null) => data.catalog.exerciseFamilies.find((family) => family.id === familyId)?.name ?? 'None';

  const coefficientFor = (coefficients: Array<{ muscle: MuscleGroup; coefficient: number }>, muscle: MuscleGroup) =>
    coefficients.find((coefficient) => coefficient.muscle === muscle)?.coefficient ?? 0;

  const coefficientRowsFromForm = (formData: FormData) =>
    data.catalog.muscleGroups
      .map((muscle) => ({ muscle, coefficient: Number(formData.get(`coefficient:${muscle}`) ?? 0) as MuscleCoefficientValue }))
      .filter((row) => row.coefficient > 0);

  const resetExerciseFilters = () => {
    exerciseFilter = '';
    exerciseEquipmentFilter = 'all';
    exerciseMuscleFilter = 'all';
  };

  const saveExerciseLibraryItem = async (event: SubmitEvent) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    const form = event.currentTarget;
    const formData = new FormData(form);

    savingCatalog = 'exercise';
    saveError = null;

    const equipmentValue = String(formData.get('equipment') ?? '').trim();
    const primaryMuscleValue = String(formData.get('primaryMuscle') ?? '').trim();
    const familyId = String(formData.get('familyId') ?? '').trim() || null;

    if (!isEquipmentType(equipmentValue)) {
      savingCatalog = null;
      saveError = 'Choose a valid equipment type.';
      return;
    }

    if (!familyId && !data.catalog.muscleGroups.includes(primaryMuscleValue as MuscleGroup)) {
      savingCatalog = null;
      saveError = 'Choose a family default or a primary muscle group.';
      return;
    }

    const result = await addExercise({
      name: String(formData.get('name') ?? '').trim(),
      primaryMuscle: primaryMuscleValue ? (primaryMuscleValue as MuscleGroup) : undefined,
      equipment: equipmentValue,
      familyId
    });

    savingCatalog = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    form.reset();
    showAddExercise = false;
    await invalidateAll();
  };

  const saveExerciseMuscleGroups = async (exerciseId: string, event: SubmitEvent) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const familyId = String(formData.get('familyId') ?? '').trim() || null;
    const muscleCoefficients = coefficientRowsFromForm(formData);

    if (!muscleCoefficients.some((row) => row.coefficient === 1)) {
      saveError = 'Choose at least one muscle with coefficient 1.0.';
      return;
    }

    savingCatalog = 'exercise-muscles';
    saveError = null;

    const result = await saveExerciseMuscles({ exerciseId, familyId, muscleCoefficients });

    savingCatalog = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    showEditMuscles = false;
    await invalidateAll();
  };

  const saveExerciseDisplayName = async (exerciseId: string, event: SubmitEvent) => {
    event.preventDefault();

    if (!(event.currentTarget instanceof HTMLFormElement)) return;

    const form = event.currentTarget;
    const name = String(new FormData(form).get('name') ?? '').trim();

    if (name.length === 0) {
      saveError = 'Exercise name is required.';
      return;
    }

    savingCatalog = 'exercise-name';
    saveError = null;

    const result = await saveExerciseName({ exerciseId, name });

    savingCatalog = null;

    if (!result.ok) {
      saveError = result.error;
      return;
    }

    showEditName = false;
    await invalidateAll();
  };
</script>

<svelte:head>
  <title>Exercises</title>
</svelte:head>

<section class="w-full overflow-x-hidden px-4 pb-6 pt-5">
  {#if selectedExercise()}
    {@const exercise = selectedExercise()}
    {#if exercise}
      <header class="sticky top-0 z-10 -mx-4 border-b border-white/10 bg-neutral-950/95 px-4 pb-3 pt-2 backdrop-blur">
        <a class="rounded-full bg-neutral-900 px-4 py-2 text-sm font-black text-neutral-200 ring-1 ring-white/10" href="/exercises">← Exercises</a>
        <div class="mt-4 flex flex-wrap gap-2">
          {#each exercise.primaryMuscles as muscle}
            <span class={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ring-1 ${muscleTone(muscle)}`}>{muscle}</span>
          {/each}
        </div>
        {#if showEditName}
          <form class="mt-3 grid gap-2" onsubmit={(event) => saveExerciseDisplayName(exercise.id, event)}>
            <input class="w-full rounded-2xl border border-cyan-300/40 bg-neutral-950 px-3 py-3 text-2xl font-black tracking-tight text-neutral-100 outline-none focus:border-cyan-300" name="name" value={exercise.name} required />
            <div class="grid grid-cols-2 gap-2">
              <button class="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-neutral-950 disabled:opacity-60" disabled={savingCatalog === 'exercise-name'} type="submit">{savingCatalog === 'exercise-name' ? 'Saving...' : 'Save'}</button>
              <button class="rounded-2xl bg-neutral-900 px-4 py-3 font-black text-neutral-200 ring-1 ring-white/10" type="button" onclick={() => (showEditName = false)}>Cancel</button>
            </div>
          </form>
        {:else}
          <div class="mt-3 flex items-start justify-between gap-3">
            <h1 class="min-w-0 text-3xl font-black tracking-tight">{exercise.name}</h1>
            <button class="shrink-0 rounded-full bg-neutral-900 px-3 py-2 text-xs font-black text-neutral-200 ring-1 ring-white/10" type="button" onclick={() => (showEditName = true)}>Edit name</button>
          </div>
        {/if}
      </header>
      {#if saveError}
        <p class="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/30">{saveError}</p>
      {/if}

      <section class="mt-4 grid gap-3">
        <article class="rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-black">Exercise facts</h2>
            <button class="rounded-full bg-cyan-300 px-3 py-2 text-xs font-black text-neutral-950" type="button" onclick={() => (showEditMuscles = !showEditMuscles)}>{showEditMuscles ? 'Close edit' : 'Edit muscles'}</button>
          </div>
          <div class="mt-3 grid gap-2 text-sm">
            <div class="rounded-2xl bg-neutral-950 px-3 py-3 ring-1 ring-white/5">
              <span class="text-neutral-500">Primary / strong muscles</span>
              <div class="mt-2 flex flex-wrap gap-2">
                {#each exercise.primaryMuscles as muscle}
                  <span class={`rounded-full px-3 py-1 text-xs font-black ring-1 ${muscleTone(muscle)}`}>{muscle}</span>
                {/each}
              </div>
            </div>
            <div class="rounded-2xl bg-neutral-950 px-3 py-3 ring-1 ring-white/5">
              <span class="text-neutral-500">Secondary muscles</span>
              {#if exercise.secondaryMuscles.length === 0}
                <p class="mt-2 text-sm font-bold text-neutral-400">None counted</p>
              {:else}
                <div class="mt-2 flex flex-wrap gap-2">
                  {#each exercise.secondaryMuscles as muscle}
                    <span class={`rounded-full px-3 py-1 text-xs font-black ring-1 ${muscleTone(muscle)}`}>{muscle} · 0.5</span>
                  {/each}
                </div>
              {/if}
            </div>
            <div class="flex justify-between rounded-2xl bg-neutral-950 px-3 py-3 ring-1 ring-white/5">
              <span class="text-neutral-500">Equipment</span>
              <span class="font-black text-neutral-100">{exercise.equipment}</span>
            </div>
            <div class="flex justify-between rounded-2xl bg-neutral-950 px-3 py-3 ring-1 ring-white/5">
              <span class="text-neutral-500">Family default</span>
              <span class="font-black text-neutral-100">{familyName(exercise.familyId)}</span>
            </div>
          </div>
          {#if showEditMuscles}
            <form class="mt-4 grid gap-4 rounded-3xl bg-neutral-950 p-4 ring-1 ring-cyan-300/20" onsubmit={(event) => saveExerciseMuscleGroups(exercise.id, event)}>
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Family provenance</p>
                <select class="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-900 px-3 py-3 text-sm font-bold text-neutral-100 outline-none focus:border-cyan-300" name="familyId">
                  <option value="">None / custom</option>
                  {#each data.catalog.exerciseFamilies as family}
                    <option value={family.id} selected={exercise.familyId === family.id}>{family.name}</option>
                  {/each}
                </select>
                <p class="mt-2 text-xs text-neutral-500">Changing this stores provenance. Coefficients below remain the concrete per-exercise snapshot.</p>
              </div>
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Muscle coefficients</p>
                <p class="mt-1 text-xs text-neutral-500">Use 1.0 for direct/full credit, 0.5 for meaningful secondary credit, and 0 for no counted volume.</p>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  {#each data.catalog.muscleGroups as muscle}
                    <label class="grid min-w-0 gap-1 rounded-2xl bg-neutral-900 px-3 py-2 text-xs font-bold text-neutral-200 ring-1 ring-white/10">
                      <span class="min-w-0 truncate">{muscle}</span>
                      <select class="rounded-xl border border-white/10 bg-neutral-950 px-2 py-2 text-xs font-black text-neutral-100" name={`coefficient:${muscle}`}>
                        <option value={0} selected={coefficientFor(exercise.muscleCoefficients, muscle) === 0}>0</option>
                        <option value={0.5} selected={coefficientFor(exercise.muscleCoefficients, muscle) === 0.5}>0.5</option>
                        <option value={1} selected={coefficientFor(exercise.muscleCoefficients, muscle) === 1}>1.0</option>
                      </select>
                    </label>
                  {/each}
                </div>
              </div>
              <button class="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-neutral-950 disabled:opacity-60" disabled={savingCatalog === 'exercise-muscles'} type="submit">{savingCatalog === 'exercise-muscles' ? 'Saving...' : 'Save coefficients'}</button>
            </form>
          {/if}
        </article>

        <article class="rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">History</p>
              <h2 class="mt-1 text-lg font-black">Top sets</h2>
            </div>
            <span class="rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-neutral-300 ring-1 ring-white/10">{exercise.history.length}</span>
          </div>

          {#if exercise.history.length === 0}
            <p class="mt-3 rounded-2xl bg-neutral-950 p-3 text-sm text-neutral-400 ring-1 ring-white/5">No logged history for this exercise yet.</p>
          {:else}
            <div class="mt-3 grid gap-2">
              {#each exercise.history as entry}
                <div class="grid grid-cols-[1fr_5rem] gap-3 rounded-2xl bg-neutral-950 p-3 ring-1 ring-white/5">
                  <div>
                    <p class="text-sm font-black text-neutral-100">{entry.label}</p>
                    <p class="mt-1 text-xs text-neutral-500">{entry.workoutName} · set {entry.setIndex}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-black text-neutral-100">{entry.loadText}</p>
                    <p class="mt-1 text-xs text-neutral-400">{entry.reps} reps</p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </article>

        <a class="rounded-2xl bg-neutral-900 px-4 py-3 text-left text-sm font-black text-neutral-100 ring-1 ring-white/10" href="/exercises">Add another exercise</a>
      </section>
    {/if}
  {:else}
    <header class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-black tracking-tight">Exercises</h1>
        <p class="mt-1 text-sm text-neutral-400">Exercise catalogue</p>
      </div>
      <button class="grid size-11 place-items-center rounded-full bg-cyan-300 text-2xl font-black text-neutral-950" type="button" aria-label={`${showAddExercise ? 'Close' : 'Add'} Exercises`} onclick={() => (showAddExercise = !showAddExercise)}>{showAddExercise ? '×' : '+'}</button>
    </header>
    {#if saveError}
      <p class="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/30">{saveError}</p>
    {/if}
    <input class="mt-4 w-full rounded-2xl border border-white/10 bg-neutral-900 px-4 py-3 outline-none focus:border-cyan-300" bind:value={exerciseFilter} placeholder="Search exercises" />
    <div class="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 text-xs font-black uppercase tracking-wide">
      <button class={`rounded-full px-3 py-2 ${exerciseEquipmentFilter === 'all' ? 'bg-cyan-300 text-neutral-950' : 'bg-neutral-900 text-neutral-300 ring-1 ring-white/10'}`} type="button" onclick={() => (exerciseEquipmentFilter = 'all')}>All</button>
      {#each equipmentTypes as equipment}
        <button class={`rounded-full px-3 py-2 ${exerciseEquipmentFilter === equipment ? 'bg-cyan-300 text-neutral-950' : 'bg-neutral-900 text-neutral-300 ring-1 ring-white/10'}`} type="button" onclick={() => (exerciseEquipmentFilter = equipment)}>{equipment}</button>
      {/each}
    </div>
    <label class="mt-2 grid gap-1 text-[0.65rem] font-bold uppercase tracking-wide text-neutral-500">
      Muscle group
      <select class="rounded-2xl border border-white/10 bg-neutral-900 px-3 py-3 text-sm font-bold text-neutral-100 outline-none focus:border-emerald-300" bind:value={exerciseMuscleFilter}>
        {#each exerciseMuscleOptions() as muscle}
          <option value={muscle}>{muscle === 'all' ? 'All muscle groups' : muscle}</option>
        {/each}
      </select>
    </label>
    {#if showAddExercise}
      <form class="mt-4 rounded-3xl bg-neutral-900 p-4 ring-1 ring-white/10" onsubmit={saveExerciseLibraryItem}>
        <input class="w-full rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="name" placeholder="Exercise name" required />
        <select class="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="familyId">
          <option value="">Choose family default by name heuristic</option>
          {#each data.catalog.exerciseFamilies as family}
            <option value={family.id}>{family.name}</option>
          {/each}
        </select>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <select class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="primaryMuscle">
            <option value="">Primary fallback</option>
            {#each data.catalog.muscleGroups as muscle}
              <option value={muscle}>{muscle}</option>
            {/each}
          </select>
          <select class="rounded-2xl border border-white/10 bg-neutral-950 px-3 py-3 outline-none focus:border-cyan-300" name="equipment" required>
            {#each equipmentTypes as equipment}
              <option value={equipment}>{equipment}</option>
            {/each}
          </select>
        </div>
        <button class="mt-3 w-full rounded-2xl bg-cyan-300 px-4 py-3 font-black text-neutral-950 disabled:opacity-60" disabled={savingCatalog === 'exercise'} type="submit">{savingCatalog === 'exercise' ? 'Adding...' : '+ Add exercise'}</button>
      </form>
    {/if}
    {#if filteredExercises().length === 0}
      <div class="mt-4 rounded-3xl bg-neutral-900 p-5 text-center ring-1 ring-white/10">
        <p class="text-lg font-black">No exercises found</p>
        <p class="mt-1 text-sm text-neutral-400">Clear the search, equipment, and muscle filters to see the full exercise list.</p>
        <button class="mt-4 rounded-2xl bg-neutral-800 px-4 py-3 text-sm font-black text-neutral-100 ring-1 ring-white/10" type="button" onclick={resetExerciseFilters}>Reset filters</button>
      </div>
    {:else}
      <div class="mt-4 grid min-w-0 gap-3">
        {#each filteredExercises() as exercise}
          <a class="min-w-0 rounded-3xl bg-neutral-900 p-4 text-left shadow-lg shadow-black/10 ring-1 ring-white/10 transition hover:bg-neutral-800" href={`/exercises?exercise=${exercise.id}`}>
            <div class="flex min-w-0 items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap gap-2">
                  {#each exercise.primaryMuscles as muscle}
                    <span class={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ring-1 ${muscleTone(muscle)}`}>{muscle}</span>
                  {/each}
                </div>
                <h2 class="mt-3 text-lg font-black">{exercise.name}</h2>
                <p class="mt-1 text-sm text-neutral-400">{exercise.equipment}</p>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</section>
