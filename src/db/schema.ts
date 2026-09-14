import {
	boolean,
	int,
	mysqlTable,
	text,
	timestamp,
	index,
	varchar,
	mysqlEnum,
	bigint,
} from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull(),
	image: text('image'),
	createdAt: timestamp('created_at', { fsp: 0 }).notNull(),
	updatedAt: timestamp('updated_at', { fsp: 0 }).notNull(),
	role: text('role'),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	banExpires: timestamp('ban_expires', { fsp: 0 }),
	customerId: text('customer_id'), // Payment provider customer ID
	plan: text('plan').notNull().default('free'), // 'free' | 'paid'
	planExpiresAt: timestamp('plan_expires_at', { fsp: 0 }),
	storageLimit: int('storage_limit'), // 用户存储空间限制（字节），为空则用默认值
	planTier: text('plan_tier'), // 'monthly' | 'yearly'，仅 paid 用户有效
	userType: text('user_type'), // 'art-fight' | null — 用户类型，扩展其他垂直场景
}, (table) => ({
	userCustomerIdIdx: index("user_customer_id_idx").on(table.customerId),
	userRoleIdx: index("user_role_idx").on(table.role),
	userPlanIdx: index("user_plan_idx").on(table.plan),
}));

export const session = mysqlTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at', { fsp: 0 }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at', { fsp: 0 }).notNull(),
	updatedAt: timestamp('updated_at', { fsp: 0 }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	impersonatedBy: text('impersonated_by')
}, (table) => ({
	sessionTokenIdx: index("session_token_idx").on(table.token),
	sessionUserIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const account = mysqlTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { fsp: 0 }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { fsp: 0 }),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at', { fsp: 0 }).notNull(),
	updatedAt: timestamp('updated_at', { fsp: 0 }).notNull()
}, (table) => ({
	accountUserIdIdx: index("account_user_id_idx").on(table.userId),
	accountAccountIdIdx: index("account_account_id_idx").on(table.accountId),
	accountProviderIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

export const verification = mysqlTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { fsp: 0 }).notNull(),
	createdAt: timestamp('created_at', { fsp: 0 }),
	updatedAt: timestamp('updated_at', { fsp: 0 })
});

export const userResource = mysqlTable("user_resource", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	originalUrl: text('original_url').notNull(),
	processedUrl: text('processed_url'),
	fileSize: int('file_size').notNull().default(0),
	mimeType: text('mime_type'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deleteAt: timestamp('delete_at'), // 计划删除时间（超额后30天）
}, (table) => ({
	resourceUserIdIdx: index("resource_user_id_idx").on(table.userId),
}));

export const userDocument = mysqlTable("user_document", {
	id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	originalFilename: text('original_filename'),
	storageKey: text('storage_key'),
	downloadUrl: text('download_url').notNull(),
	fileSize: int('file_size').notNull().default(0),
	mimeType: text('mime_type'),
	fileExt: varchar('file_ext', { length: 20 }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deleteAt: timestamp('delete_at'),
}, (table) => ({
	documentUserIdIdx: index("document_user_id_idx").on(table.userId),
}));

/**
 * 支付引导/价格页跳转事件表
 * - 仅在「真正跳转到支付页面（/pricing 或 checkout）」的瞬间记录一次
 * - 用于统计用户从哪个页面/哪个按钮触发跳转，避免全站监听造成资源消耗
 */
export const pricingRedirectEvent = mysqlTable(
	"pricing_redirect_events",
	{
		id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
		createdAt: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),

		userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
		sessionId: varchar("session_id", { length: 64 }),

		eventType: varchar("event_type", { length: 32 }).notNull(), // navigate_pricing / start_checkout ...
		fromPath: varchar("from_path", { length: 255 }),
		fromUrl: text("from_url"),
		toPath: varchar("to_path", { length: 255 }),

		sourceModule: varchar("source_module", { length: 64 }).notNull(), // dashboard_photos / dashboard_documents / site_header ...
		sourceAction: varchar("source_action", { length: 64 }).notNull(), // click_upgrade_btn / upload_exceed_limit ...

		planAtTime: varchar("plan_at_time", { length: 32 }),
		meta: text("meta"), // JSON 字符串（扩展信息：locale/device/limit/button 等）

		ip: varchar("ip", { length: 45 }), // IPv4 / IPv6
		userAgent: varchar("user_agent", { length: 255 }),
	},
	(table) => ({
		userCreatedAtIdx: index("pricing_redirect_user_created_at_idx").on(table.userId, table.createdAt),
		eventCreatedAtIdx: index("pricing_redirect_event_created_at_idx").on(table.eventType, table.createdAt),
		fromPathCreatedAtIdx: index("pricing_redirect_from_path_created_at_idx").on(table.fromPath, table.createdAt),
		sourceCreatedAtIdx: index("pricing_redirect_source_created_at_idx").on(table.sourceModule, table.sourceAction, table.createdAt),
	})
);

// 订阅 / 支付事件记录表
export const payment = mysqlTable("payment", {
	id: text("id").primaryKey(), // Payment ID (UUID)
	priceId: text('price_id').notNull(), // Provider product / price ID
	type: text('type').notNull(), // 'subscription' | 'one_time'
	scene: text('scene'), // 'subscription'
	interval: text('interval'), // 'month' | 'year'
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(), // Provider customer ID
	subscriptionId: text('subscription_id'), // Provider subscription ID
	sessionId: text('session_id'), // Checkout session / order ID
	invoiceId: text('invoice_id').unique(), // Provider payment / invoice ID (防重复)
	status: text('status').notNull(), // 'active' | 'canceled' | 'past_due' | 'expired'
	paid: boolean('paid').notNull().default(false), // 是否已支付
	periodStart: timestamp('period_start'), // 订阅周期开始
	periodEnd: timestamp('period_end'), // 订阅周期结束
	cancelAtPeriodEnd: boolean('cancel_at_period_end'), // 是否取消但到期前继续
	trialStart: timestamp('trial_start'), // 试用开始
	trialEnd: timestamp('trial_end'), // 试用结束
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	paymentTypeIdx: index("payment_type_idx").on(table.type),
	paymentSceneIdx: index("payment_scene_idx").on(table.scene),
	paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
	paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
	paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
	paymentStatusIdx: index("payment_status_idx").on(table.status),
	paymentPaidIdx: index("payment_paid_idx").on(table.paid),
	paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
	paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
	paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

export const contactMessage = mysqlTable(
	"contact_messages",
	{
		id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		email: varchar("email", { length: 255 }).notNull(),
		message: text("message").notNull(),
		status: mysqlEnum("status", ["new", "read", "replied"]).notNull().default("new"),
		createdAt: timestamp("created_at", { fsp: 0 }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { fsp: 0 }).notNull().defaultNow().onUpdateNow(),
	},
	(table) => ({
		contactStatusCreatedAtIdx: index("contact_status_created_at_idx").on(table.status, table.createdAt),
	})
);

