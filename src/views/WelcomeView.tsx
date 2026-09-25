import { PatientsView } from './PatientsView';

/**
 * Re-export PatientsView as WelcomeView to replace the legacy Welcome page
 * while preserving backward compatibility for existing imports.
 */
export const WelcomeView = PatientsView;
export default PatientsView;
