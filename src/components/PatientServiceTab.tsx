import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import type { PatientService } from '../types';

export const PatientServiceTab = defineComponent({
    name: 'PatientServiceTab',
    props: {
        service: {
            type: String as PropType<PatientService>,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        active: {
            type: Boolean,
            required: true,
        },
        count: {
            type: Number,
            required: true,
        },
        loading: {
            type: Boolean,
            required: true,
        },
        onSelect: {
            type: Function as PropType<(service: PatientService) => void>,
            required: true,
        },
    },
    setup(props) {
        const renderIcon = () => {
            switch (props.service) {
                case 'general':
                    return (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
                            <path d="M9 12.5v4a4.5 4.5 0 0 0 9 0v-2.5" />
                            <circle cx="18" cy="14" r="3" />
                        </svg>
                    );
                case 'urgence':
                    return (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    );
                case 'oncologie':
                    return (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M12 2a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5z" />
                            <path d="M9 16l-3 6" />
                            <path d="M15 16l3 6" />
                        </svg>
                    );
                case 'cardiologie':
                    return (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.66l7.65-7.65.77-.78a5.4 5.4 0 0 0 0-7.65z" />
                        </svg>
                    );
            }
        };

        return () => (
            <button
                id={`tab-${props.service}`}
                role="tab"
                aria-selected={props.active}
                class={`tab-button ${props.active ? 'tab-button-active' : ''}`}
                onClick={() => props.onSelect(props.service)}
            >
                <span class="tab-icon">{renderIcon()}</span>
                <span class="tab-label">{props.label}</span>
                {props.active && (
                    <span class="tab-count-badge">
                        {props.loading ? '...' : props.count}
                    </span>
                )}
            </button>
        );
    },
});

export default PatientServiceTab;