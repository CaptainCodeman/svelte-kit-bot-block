import { createHandler } from '$lib'

export const handle = createHandler({ hostnames: [/^localhost$/] })
