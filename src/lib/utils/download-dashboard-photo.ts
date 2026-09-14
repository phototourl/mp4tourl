/**
 * 工作台「我的照片」：同域触发下载，不打开新标签。
 * 由 `/api/resources/download` 按资源 ID 校验归属后拉取 R2 并返回 attachment。
 */
export function triggerDashboardPhotoDownload(resourceId: string, options?: { originalOnly?: boolean }) {
	const params = new URLSearchParams({ id: resourceId });
	if (options?.originalOnly) {
		params.set('original', '1');
	}
	const a = document.createElement('a');
	a.href = `/api/resources/download?${params.toString()}`;
	a.rel = 'noopener';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}
