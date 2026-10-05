/*
 * Site-wide OS preference ("win" | "linux" | "mac"). Inlined into <head> on every page (home
 * layout and Starlight `head` config), so it runs before any body content is parsed.
 *
 * - First visit: detected from navigator.userAgentData.platform / navigator.platform.
 *   iPadOS reports "MacIntel" but has touch points; phones and tablets can't run KoboldCpp, so they
 *   get the default ("win", the most common desktop), not "mac".
 * - An explicit choice (clicking an OS tab) is stored and always wins.
 * - Keeps Starlight's synced-tabs key (`starlight-synced-tabs__os`) in step in both directions:
 *   it is seeded here before Starlight's tab-restore element runs (no flash of the wrong tab), and a
 *   tab click that changed it on another page is adopted as an explicit choice.
 * - Exposes window.kcppOs { get(), set(os) } and fires `kcpp:os` on document when it changes,
 *   including on back/forward (bfcache `pageshow`) and when another browser tab changes it.
 * All storage access is wrapped in try/catch (private mode, blocked storage).
 */
(function () {
	var KEY = 'kcpp-os';
	var EXPLICIT = 'kcpp-os-explicit';
	var TABS = 'starlight-synced-tabs__os';
	var LABEL = { win: 'Windows', linux: 'Linux', mac: 'macOS' };

	function read(k) {
		try { return localStorage.getItem(k); } catch (e) { return null; }
	}
	function write(k, v) {
		try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ }
	}
	function fromLabel(label) {
		for (var os in LABEL) if (LABEL[os] === label) return os;
		return null;
	}
	function detect() {
		var nav = navigator;
		var ua = (nav.userAgent || '').toLowerCase();
		var platform = ((nav.userAgentData && nav.userAgentData.platform) || nav.platform || '').toLowerCase();
		var touchMac = platform.indexOf('mac') > -1 && nav.maxTouchPoints > 1; // iPadOS
		if (/android|iphone|ipad|ipod/.test(ua) || touchMac) return 'win';
		if (platform.indexOf('mac') > -1) return 'mac';
		if (/linux|x11|cros/.test(platform)) return 'linux';
		return 'win';
	}

	/** The OS to use now: an explicit choice, else a tab change made elsewhere, else detection. */
	function resolve() {
		var stored = read(KEY);
		var explicit = read(EXPLICIT) === '1' && !!LABEL[stored];
		var tabsOs = fromLabel(read(TABS));
		var os = explicit ? stored : detect();
		// A synced OS tab clicked on another page since we last wrote the key: that is a choice.
		if (tabsOs && stored && tabsOs !== stored) {
			os = tabsOs;
			explicit = true;
		}
		write(KEY, os);
		write(TABS, LABEL[os]);
		if (explicit) write(EXPLICIT, '1');
		return os;
	}

	function syncTabs(next) {
		var groups = document.querySelectorAll('starlight-tabs[data-sync-key="os"]');
		for (var g = 0; g < groups.length; g++) {
			var el = groups[g];
			if (!el.tabs || typeof el.switchTab !== 'function') continue;
			for (var i = 0; i < el.tabs.length; i++) {
				var tab = el.tabs[i];
				if (tab.textContent.trim() === LABEL[next] && tab.getAttribute('aria-selected') !== 'true') {
					el.switchTab(tab, i, false);
				}
			}
		}
	}

	/** Show `next` everywhere on this page: <html data-os>, OS tabs, and `kcpp:os` listeners. */
	function apply(next) {
		if (!LABEL[next]) return;
		var changed = document.documentElement.dataset.os !== next;
		document.documentElement.dataset.os = next;
		syncTabs(next);
		if (changed) document.dispatchEvent(new CustomEvent('kcpp:os', { detail: next }));
	}

	document.documentElement.dataset.os = resolve();

	window.kcppOs = {
		labels: LABEL,
		get: function () { return document.documentElement.dataset.os || 'win'; },
		set: function (next) {
			if (!LABEL[next]) return;
			write(KEY, next);
			write(EXPLICIT, '1');
			write(TABS, LABEL[next]);
			apply(next);
		},
	};

	// Only a real tab control is a choice (a click inside a panel is not). Starlight has already
	// switched the tab when this bubbling listener runs, for clicks and for arrow keys.
	function fromTabEvent(e) {
		var tab = e.target && e.target.closest && e.target.closest('[role="tab"]');
		var group = tab && tab.closest('starlight-tabs[data-sync-key="os"]');
		if (!group) return;
		var selected = group.querySelector('[role="tab"][aria-selected="true"]');
		var next = selected && fromLabel(selected.textContent.trim());
		if (next) window.kcppOs.set(next);
	}
	document.addEventListener('click', fromTabEvent);
	document.addEventListener('keydown', fromTabEvent);

	// If storage is blocked, Starlight's restore can't read the seeded key: match the tabs to the
	// in-memory choice once the page has parsed.
	document.addEventListener('DOMContentLoaded', function () { syncTabs(window.kcppOs.get()); });

	// Back/forward cache: the page comes back as it was left; pick up a choice made meanwhile.
	window.addEventListener('pageshow', function (e) {
		if (e.persisted) apply(resolve());
	});

	// Other open tabs of the site changed the choice.
	window.addEventListener('storage', function (e) {
		if (e.key === KEY || e.key === TABS || e.key === null) apply(resolve());
	});
})();
