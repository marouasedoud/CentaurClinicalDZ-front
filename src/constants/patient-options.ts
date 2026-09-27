export const TRIAGE_LEVELS = [
    { value: 1, label: 'Niveau 1 — Réanimation', className: 'triage-1' },
    { value: 2, label: 'Niveau 2 — Très urgent', className: 'triage-2' },
    { value: 3, label: 'Niveau 3 — Urgent', className: 'triage-3' },
    { value: 4, label: 'Niveau 4 — Moins urgent', className: 'triage-4' },
    { value: 5, label: 'Niveau 5 — Non urgent', className: 'triage-5' },
] as const;

export const STAGE_LEVELS = [
    { value: 1, label: 'Stade I', className: 'stade-1' },
    { value: 2, label: 'Stade II', className: 'stade-2' },
    { value: 3, label: 'Stade III', className: 'stade-3' },
    { value: 4, label: 'Stade IV', className: 'stade-4' },
] as const;