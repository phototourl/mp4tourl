/** 仪表盘列表、以及 GET /api/resources 在出现分页参数但省略 pageSize 时的默认每页条数 */
export const RESOURCE_LIST_PAGE_SIZE_DEFAULT = 20;

/** 我的文档列表默认每页条数（与 GET /api/documents 省略 pageSize 时一致） */
export const DOCUMENT_LIST_PAGE_SIZE_DEFAULT = 10;

/** 裸 GET /api/resources（无 page/pageSize）时首屏条数，兼容设置页等用量汇总 */
export const RESOURCE_BULK_FETCH_PAGE_SIZE = 1000;
