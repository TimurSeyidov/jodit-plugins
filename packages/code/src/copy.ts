/**
 * Puts `text` on the clipboard. Uses the Clipboard API, and a hidden text area with `execCommand('copy')` where the
 * API is missing or denied (an http page, an old browser). Resolves to whether the text was copied.
 */
export async function copyText(text: string, doc: Document = document): Promise<boolean> {
	try {
		await doc.defaultView?.navigator.clipboard.writeText(text);
		return true;
	} catch {
		const area = doc.createElement('textarea');
		area.value = text;
		area.setAttribute('readonly', '');
		area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
		doc.body.appendChild(area);
		area.select();

		try {
			return doc.execCommand('copy');
		} catch {
			return false;
		} finally {
			area.remove();
		}
	}
}
