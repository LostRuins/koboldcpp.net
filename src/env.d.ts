type KcppOs = 'win' | 'linux' | 'mac';

interface Window {
	/** Site-wide OS preference, defined by the inline head script src/scripts/os-pref.js. */
	kcppOs?: {
		labels: Record<KcppOs, string>;
		get(): KcppOs;
		set(os: string): void;
	};
}
