import { createAuthClient } from 'better-auth/react';
import { getBaseUrl } from './urls';

/**
 * https://www.better-auth.com/docs/installation#create-client-instance
 */
export const authClient = createAuthClient({
	baseURL: getBaseUrl(),
	sessionOptions: {
		/** 切回页签不要自动拉 session，否则会打接口并把顶栏登录弹框状态卸掉 */
		refetchOnWindowFocus: false,
	},
	plugins: [
		// https://www.better-auth.com/docs/plugins/admin#add-the-client-plugin
		// adminClient(),
		// https://www.better-auth.com/docs/concepts/typescript#inferring-additional-fields-on-client
		// inferAdditionalFields<typeof auth>(),
	],
});
