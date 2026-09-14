import {
  bigint,
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const user = mysqlTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    role: text('role'),
    banned: boolean('banned'),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    customerId: text('customer_id'),
    plan: text('plan').notNull().default('free'),
    planExpiresAt: timestamp('plan_expires_at'),
    storageLimit: bigint('storage_limit', { mode: 'number' }),
    planTier: text('plan_tier'),
    /** 文件管理指引：点过引导后为 true */
    filesGuideSeen: boolean('files_guide_seen').notNull().default(false),
  },
  (table) => ({
    userIdIdx: index('user_id_idx').on(table.id),
    userCustomerIdIdx: index('user_customer_id_idx').on(table.customerId),
    userRoleIdx: index('user_role_idx').on(table.role),
    userPlanIdx: index('user_plan_idx').on(table.plan),
  })
);

export const session = mysqlTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => ({
    sessionTokenIdx: index('session_token_idx').on(table.token),
    sessionUserIdIdx: index('session_user_id_idx').on(table.userId),
  })
);

export const account = mysqlTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => ({
    accountUserIdIdx: index('account_user_id_idx').on(table.userId),
    accountAccountIdIdx: index('account_account_id_idx').on(table.accountId),
    accountProviderIdIdx: index('account_provider_id_idx').on(table.providerId),
  })
);

export const verification = mysqlTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const payment = mysqlTable(
  'payment',
  {
    id: text('id').primaryKey(),
    priceId: text('price_id').notNull(),
    type: text('type').notNull(),
    /** lifetime | subscription */
    scene: text('scene'),
    interval: text('interval'),
    /** 访客支付可为空 */
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    guestEmail: varchar('guest_email', { length: 255 }),
    exportToken: varchar('export_token', { length: 255 }),
    customerId: text('customer_id').notNull(),
    subscriptionId: text('subscription_id'),
    sessionId: text('session_id'),
    /** unique — avoid duplicate webhook processing */
    invoiceId: text('invoice_id').unique(),
    status: text('status').notNull(),
    paid: boolean('paid').notNull().default(false),
    /** Captured at checkout create (from request UA) */
    deviceType: varchar('device_type', { length: 32 }),
    deviceOs: varchar('device_os', { length: 64 }),
    deviceBrowser: varchar('device_browser', { length: 64 }),
    deviceUserAgent: varchar('device_user_agent', { length: 255 }),
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end'),
    trialStart: timestamp('trial_start'),
    trialEnd: timestamp('trial_end'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    paymentTypeIdx: index('payment_type_idx').on(table.type),
    paymentSceneIdx: index('payment_scene_idx').on(table.scene),
    paymentPriceIdIdx: index('payment_price_id_idx').on(table.priceId),
    paymentUserIdIdx: index('payment_user_id_idx').on(table.userId),
    paymentGuestEmailIdx: index('payment_guest_email_idx').on(table.guestEmail),
    paymentExportTokenIdx: index('payment_export_token_idx').on(
      table.exportToken
    ),
    paymentCustomerIdIdx: index('payment_customer_id_idx').on(table.customerId),
    paymentStatusIdx: index('payment_status_idx').on(table.status),
    paymentPaidIdx: index('payment_paid_idx').on(table.paid),
    paymentDeviceTypeIdx: index('payment_device_type_idx').on(table.deviceType),
    paymentSubscriptionIdIdx: index('payment_subscription_id_idx').on(
      table.subscriptionId
    ),
    paymentSessionIdIdx: index('payment_session_id_idx').on(table.sessionId),
    paymentInvoiceIdIdx: index('payment_invoice_id_idx').on(table.invoiceId),
  })
);

/** 访客单次付费：拿到视频 CDN 链接后邮件下发 */
export const guestExport = mysqlTable(
  'guest_export',
  {
    exportToken: varchar('export_token', { length: 255 }).primaryKey(),
    guestEmail: varchar('guest_email', { length: 255 }).notNull(),
    snapshot: text('snapshot').notNull(),
    emailSent: boolean('email_sent').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => ({
    guestExportEmailIdx: index('guest_export_email_idx').on(table.guestEmail),
    guestExportExpiresIdx: index('guest_export_expires_idx').on(
      table.expiresAt
    ),
  })
);

/** 用户上传的视频及 CDN 链接 */
export const userFile = mysqlTable(
  'user_file',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    title: varchar('title', { length: 255 }),
    originalUrl: text('original_url').notNull(),
    processedUrl: text('processed_url'),
    fileSize: int('file_size').notNull().default(0),
    mimeType: text('mime_type'),
    resourceType: varchar('resource_type', { length: 64 })
      .notNull()
      .default('upload'),
    paymentStatus: varchar('payment_status', { length: 32 })
      .notNull()
      .default('pending_pay'),
    snapshot: text('snapshot'),
    schemaVersion: int('schema_version').notNull().default(1),
    sourceTemplate: varchar('source_template', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deleteAt: timestamp('delete_at'),
  },
  (table) => ({
    fileUserIdIdx: index('file_user_id_idx').on(table.userId),
    fileUserCreatedIdx: index('file_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
  })
);

export const contactMessage = mysqlTable(
  'contact_messages',
  {
    id: bigint('id', { mode: 'number', unsigned: true })
      .autoincrement()
      .primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    message: text('message').notNull(),
    status: mysqlEnum('status', ['new', 'read', 'replied'])
      .notNull()
      .default('new'),
    createdAt: timestamp('created_at', { fsp: 0 }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { fsp: 0 }).notNull().defaultNow(),
  },
  (table) => ({
    statusCreatedAtIdx: index('idx_status_created_at').on(
      table.status,
      table.createdAt
    ),
  })
);

/** 访问/转化分析（按 5 分钟桶去重） */
export const visitorAccessEvent = mysqlTable(
  'visitor_access_events',
  {
    id: bigint('id', { mode: 'number', unsigned: true })
      .autoincrement()
      .primaryKey(),
    createdAt: timestamp('created_at', { fsp: 3 }).notNull().defaultNow(),
    userId: varchar('user_id', { length: 255 }),
    sessionId: varchar('session_id', { length: 64 }),
    eventType: varchar('event_type', { length: 32 })
      .notNull()
      .default('page_view'),
    fromPath: varchar('from_path', { length: 255 }).notNull().default(''),
    fromUrl: text('from_url'),
    ip: varchar('ip', { length: 45 }),
    userAgent: varchar('user_agent', { length: 255 }),
    deviceType: varchar('device_type', { length: 32 }),
    os: varchar('os', { length: 64 }),
    browser: varchar('browser', { length: 64 }),
    customerGroup: varchar('customer_group', { length: 32 }),
    meta: text('meta'),
    visitBucket5m: bigint('visit_bucket_5m', { mode: 'number' }).notNull(),
  },
  (table) => ({
    ukIpEventPath5m: uniqueIndex('uk_ip_event_path_5m').on(
      table.ip,
      table.eventType,
      table.fromPath,
      table.visitBucket5m
    ),
    createdAtIdx: index('idx_created_at').on(table.createdAt),
  })
);
